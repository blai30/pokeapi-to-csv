import PokeAPI, {
  type Ability,
  type Pokemon,
  type PokemonForm,
} from 'pokedex-promise-v2'
import type { Row } from './models'
import {
  ColorKey,
  ColorLabels,
  DamageClassKey,
  DamageClassLabels,
  EggGroupKey,
  EggGroupLabels,
  GenerationNumber,
  GrowthRateKey,
  GrowthRateLabels,
  ShapeKey,
  ShapeLabels,
  StatKey,
  StatLabels,
  StatLabelsFull,
  TypeKey,
  TypeLabels,
} from './models'
import fs from 'fs/promises'
import path from 'path'

async function main() {
  const pokeapi = new PokeAPI()

  const speciesList = await pokeapi.getPokemonSpeciesList({
    limit: 386,
    offset: 0,
  })
  const species = await Promise.all(
    speciesList.results.map(async (result) => {
      const species = await pokeapi.getPokemonSpeciesByName(result.name)
      return species
    })
  )

  // Map of { deoxys: [deoxys-normal, deoxys-attack, etc] }
  const speciesToVariantsMap: Record<string, Pokemon[]> = {}
  const variantToFormsMap: Record<string, PokemonForm[]> = {}
  for (const specie of species) {
    console.log(`Processing species: ${specie.name}`)
    const variantPromises = specie.varieties.map((variety) => {
      const variant = pokeapi.getPokemonByName(variety.pokemon.name)
      return variant
    })
    speciesToVariantsMap[specie.name] = await Promise.all(variantPromises)
  }

  for (const specie of species) {
    for (const variant of speciesToVariantsMap[specie.name] || []) {
      console.log(
        `Processing variant: ${variant.name} for species: ${specie.name}`
      )
      const formPromises = variant.forms.map((form) => {
        return pokeapi.getPokemonFormByName(form.name)
      })
      variantToFormsMap[variant.name] = await Promise.all(formPromises)
    }
  }

  // console.log(speciesToVariantsMap)
  // console.log(variantToFormsMap)

  // ability slug => ability name and description
  // e.g. 'battle-armor' => { 'Battle Armor', 'Battle Armor prevents the Pokémon from receiving critical hits.' }
  const abilitiesMap: Record<string, { name: string; description: string }> = {}
  for (const specie of species) {
    for (const variant of speciesToVariantsMap[specie.name] || []) {
      for (const ability of variant.abilities) {
        if (!abilitiesMap[ability.ability.name]) {
          console.log(`Processing ability: ${ability.ability.name}`)
          const abilityData = await pokeapi.getAbilityByName(
            ability.ability.name
          )
          abilitiesMap[ability.ability.name] = {
            name:
              abilityData.names.find((n) => n.language.name === 'en')?.name ??
              ability.ability.name,
            description:
              abilityData.effect_entries.find((e) => e.language.name === 'en')
                ?.short_effect ?? '',
          }
        }
      }
    }
  }

  const totalExpMap: Record<string, number> = {}
  const growthRatesList = await pokeapi.getGrowthRatesList()
  const growthRates = await Promise.all(
    growthRatesList.results.map((resource) => {
      return pokeapi.getGrowthRateByName(resource.name)
    })
  )
  for (const growthRate of growthRates) {
    console.log(`Processing growth rate: ${growthRate.name}`)
    const totalExp = growthRate.levels[99]?.experience ?? 0
    totalExpMap[growthRate.name] = totalExp
  }

  // Flatten the speciesMap into an array of Row objects
  const rows: Row[] = species.flatMap((specie) => {
    /**
     * Assumptions:
     * - Weight comes in hectograms (hg), so we convert to kilograms (kg)
     * - Height comes in decimeters (dm), so we convert to meters (m)
     * - Catch rate is out of 255, higher is easier to catch
     * - Base happiness is out of 255, higher is happier
     * - Gender ratio is out of 8, higher is more female, -1 is genderless, we need to convert it to a percentage
     */
    const variants = speciesToVariantsMap[specie.name] || []
    const category = specie.is_baby
      ? 'Baby'
      : specie.is_legendary
        ? 'Legendary'
        : specie.is_mythical
          ? 'Mythical'
          : 'Ordinary'

    return variants.map((variant) => {
      const forms = variantToFormsMap[variant.name] || []
      const variantName =
        variant.is_default || specie.name === variant.name
          ? specie.names.find((n) => n.language.name === 'en')?.name
          : forms
              .find((f) => f.is_default)
              ?.names.find((n) => n.language.name === 'en')?.name
      const row: Row = {
        dexId: specie.id,
        slug: variant.name,
        species: specie.names.find((n) => n.language.name === 'en')?.name ?? '',
        variant: variantName ?? '',
        genera:
          specie.genera.find((g) => g.language.name === 'en')?.genus ?? '',
        generation: GenerationNumber[specie.generation.name] ?? 0,
        type1: TypeLabels[variant.types[0]!.type.name as TypeKey],
        type2:
          variant.types.length > 1
            ? TypeLabels[variant.types[1]?.type.name as TypeKey]
            : undefined,
        weight: variant.weight / 10,
        height: variant.height / 10,
        catchRate: specie.capture_rate,
        baseHappiness: specie.base_happiness,
        baseExp: variant.base_experience,
        totalExp: totalExpMap[specie.growth_rate.name] ?? 0,
        growthRate: GrowthRateLabels[specie.growth_rate.name as GrowthRateKey],
        genderFemale:
          specie.gender_rate >= 0 ? (specie.gender_rate / 8) * 100 : undefined,
        genderMale:
          specie.gender_rate >= 0
            ? 100 - (specie.gender_rate / 8) * 100
            : undefined,
        genderless: specie.gender_rate === -1,
        ability1:
          abilitiesMap[variant.abilities[0]!.ability.name]?.name ??
          variant.abilities[0]!.ability.name ??
          undefined,
        ability2:
          abilitiesMap[variant.abilities[1]?.ability.name!]?.name ??
          variant.abilities[1]?.ability.name ??
          undefined,
        abilityHidden:
          abilitiesMap[
            variant.abilities.find((a) => a.is_hidden)?.ability.name!
          ]?.name ??
          variant.abilities.find((a) => a.is_hidden)?.ability.name ??
          undefined,
        ability1Description:
          abilitiesMap[variant.abilities[0]!.ability.name]?.description ??
          variant.abilities[0]!.ability.name ??
          '',
        ability2Description:
          abilitiesMap[variant.abilities[1]?.ability.name!]?.description ??
          variant.abilities[1]?.ability.name ??
          '',
        abilityHiddenDescription:
          abilitiesMap[
            variant.abilities.find((a) => a.is_hidden)?.ability.name!
          ]?.description ??
          variant.abilities.find((a) => a.is_hidden)?.ability.name ??
          '',
        hp:
          variant.stats.find((s) => s.stat.name === StatKey.Hp)?.base_stat ?? 0,
        attack:
          variant.stats.find((s) => s.stat.name === StatKey.Attack)
            ?.base_stat ?? 0,
        defense:
          variant.stats.find((s) => s.stat.name === StatKey.Defense)
            ?.base_stat ?? 0,
        specialAttack:
          variant.stats.find((s) => s.stat.name === StatKey.SpecialAttack)
            ?.base_stat ?? 0,
        specialDefense:
          variant.stats.find((s) => s.stat.name === StatKey.SpecialDefense)
            ?.base_stat ?? 0,
        speed:
          variant.stats.find((s) => s.stat.name === StatKey.Speed)?.base_stat ??
          0,
        evHp:
          variant.stats.find((s) => s.stat.name === StatKey.Hp)?.effort ?? 0,
        evAttack:
          variant.stats.find((s) => s.stat.name === StatKey.Attack)?.effort ??
          0,
        evDefense:
          variant.stats.find((s) => s.stat.name === StatKey.Defense)?.effort ??
          0,
        evSpecialAttack:
          variant.stats.find((s) => s.stat.name === StatKey.SpecialAttack)
            ?.effort ?? 0,
        evSpecialDefense:
          variant.stats.find((s) => s.stat.name === StatKey.SpecialDefense)
            ?.effort ?? 0,
        evSpeed:
          variant.stats.find((s) => s.stat.name === StatKey.Speed)?.effort ?? 0,
        eggCycles: specie.hatch_counter,
        eggGroup1:
          EggGroupLabels[specie.egg_groups[0]?.name as EggGroupKey] ??
          undefined,
        eggGroup2:
          EggGroupLabels[specie.egg_groups[1]?.name as EggGroupKey] ??
          undefined,
        color: ColorLabels[specie.color.name as ColorKey],
        shape: ShapeLabels[specie.shape.name as ShapeKey],
        category: category,
      }
      console.log(
        `Processing ${row.slug} (${row.species}) - Variant: ${row.variant}`
      )
      return row
    })
  })

  // Convert rows to CSV with kebab-case headers, overwrite existing file
  const csvHeaders = Object.keys(rows[0]!)
    .map((key) => key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase())
    .join(',')
  const csvRows = rows.map((row) =>
    Object.values(row)
      .map((value) => (typeof value === 'string' ? `"${value}"` : value))
      .join(',')
  )
  const csvContent = [csvHeaders, ...csvRows].join('\n')
  const outputPath = path.join(__dirname, 'out', 'pokedeck-cms.csv')
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, csvContent)
  console.log(`CSV file created at ${outputPath}`)
  console.log(`Total rows processed: ${rows.length}`)
}

await main()
