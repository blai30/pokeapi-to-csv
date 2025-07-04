import fs from 'fs/promises'
import path from 'path'
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

// Helper to batch async calls
async function batch<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize = 20,
  delayMs = 0
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batchItems = items.slice(i, i + batchSize)
    results.push(...(await Promise.all(batchItems.map(fn))))
    if (delayMs && i + batchSize < items.length) {
      await new Promise((res) => setTimeout(res, delayMs))
    }
  }
  return results
}

// Utility: kebab-case
function toKebab(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

// Utility: CSV escape
function csvEscape(val: unknown): string {
  if (val === undefined || val === null) return ''
  const s = String(val)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Utility: get English name or other property
function getEnglishName<T extends { language: { name: string } }>(
  arr: T[] | undefined,
  fallback = '',
  prop: keyof T = 'name' as keyof T
) {
  if (!arr) return fallback
  const found = arr.find((n) => n.language.name === 'en')
  return found ? (found[prop] as string) : fallback
}

// Utility: batch map for objects (skip undefined results, pass index)
async function batchMap<T, R>(
  items: T[],
  fn: (item: T, idx: number) => Promise<R | undefined>,
  batchSize = 20,
  delayMs = 0
): Promise<Record<string, R>> {
  const out: Record<string, R> = {}
  for (let i = 0; i < items.length; i += batchSize) {
    const batchItems = items.slice(i, i + batchSize)
    const results = await Promise.all(
      batchItems.map((item, idx) => fn(item, i + idx))
    )
    batchItems.forEach((item, idx) => {
      if (results[idx] !== undefined) out[String(item)] = results[idx] as R
    })
    if (delayMs && i + batchSize < items.length)
      await new Promise((res) => setTimeout(res, delayMs))
  }
  return out
}

async function main() {
  const pokeapi = new PokeAPI()
  console.log('Fetching Pokémon species list...')
  const speciesList = await pokeapi.getPokemonSpeciesList({
    limit: 1025,
    offset: 0,
  })
  console.log(`Fetched ${speciesList.results.length} species.`)
  // Batch fetch species details
  console.log('Fetching species details in batches...')
  const species = await batch(
    speciesList.results,
    (r) => pokeapi.getPokemonSpeciesByName(r.name),
    20,
    100
  )
  console.log('Fetched all species details.')

  // Batch fetch variants for each species
  const speciesToVariantsMap: Record<string, Pokemon[]> = {}
  console.log('Fetching variants for each species...')
  await Promise.all(
    species.map(async (specie, idx) => {
      if (idx % 50 === 0)
        console.log(`  Processing species ${idx + 1} / ${species.length}`)
      speciesToVariantsMap[specie.name] = await batch(
        specie.varieties,
        (v) => pokeapi.getPokemonByName(v.pokemon.name),
        20,
        100
      )
    })
  )
  console.log('Fetched all variants.')

  // Batch fetch forms for each variant
  const variantToFormsMap: Record<string, PokemonForm[]> = {}
  console.log('Fetching forms for each variant...')
  const allVariants = species.flatMap(
    (specie) => speciesToVariantsMap[specie.name] || []
  )
  await Promise.all(
    allVariants.map(async (variant, idx) => {
      if (idx % 100 === 0)
        console.log(`  Processing variant ${idx + 1} / ${allVariants.length}`)
      variantToFormsMap[variant.name] = await batch(
        variant.forms,
        (f) => pokeapi.getPokemonFormByName(f.name),
        20,
        100
      )
    })
  )
  console.log('Fetched all forms.')

  // Batch fetch all unique abilities
  const allAbilityNames = Array.from(
    new Set(
      species.flatMap((specie) =>
        (speciesToVariantsMap[specie.name] || []).flatMap((variant) =>
          variant.abilities.map((a) => a.ability.name)
        )
      )
    )
  )
  console.log(`Fetching ${allAbilityNames.length} unique abilities...`)
  const abilitiesMap: Record<string, { name: string; description: string }> =
    await batchMap(
      allAbilityNames,
      async (abilityName, idx) => {
        if (idx % 50 === 0)
          console.log(
            `  Processing ability ${idx + 1} / ${allAbilityNames.length}`
          )
        const abilityData = await pokeapi.getAbilityByName(abilityName)
        return {
          name: getEnglishName(abilityData.names, abilityName),
          description:
            abilityData.effect_entries?.find((e) => e.language.name === 'en')
              ?.short_effect ?? '',
        }
      },
      20,
      100
    )
  console.log('Fetched all abilities.')

  // Batch fetch all growth rates
  const growthRatesList = await pokeapi.getGrowthRatesList()
  console.log(`Fetching ${growthRatesList.results.length} growth rates...`)
  const growthRatesMap: Record<string, number> = await batchMap(
    growthRatesList.results.map((r) => r.name),
    async (name, idx) => {
      if (idx % 5 === 0)
        console.log(
          `  Processing growth rate ${idx + 1} / ${growthRatesList.results.length}`
        )
      const growthRate = await pokeapi.getGrowthRateByName(name)
      return growthRate.levels[99]?.experience ?? 0
    },
    10,
    100
  )
  console.log('Fetched all growth rates.')

  // Flatten the speciesMap into an array of Row objects
  console.log('Building rows for CSV export...')
  const rows: Row[] = species.flatMap((specie, specieIdx) => {
    const variants = speciesToVariantsMap[specie.name] || []
    const category = specie.is_baby
      ? 'Baby'
      : specie.is_legendary
        ? 'Legendary'
        : specie.is_mythical
          ? 'Mythical'
          : 'Ordinary'
    return variants.map((variant, variantIdx) => {
      if (variantIdx === 0)
        console.log(`  Processing variants for species ${specie.name}`)
      const forms = variantToFormsMap[variant.name] || []
      const variantName =
        variant.is_default || specie.name === variant.name
          ? getEnglishName(specie.names, '')
          : getEnglishName(forms.find((f) => f.is_default)?.names, '')
      const imageId = specie.id.toString().padStart(4, '0')
      const row: Row = {
        dexId: specie.id,
        imageUrl: variant.is_default
          ? `https://raw.githubusercontent.com/blai30/PokemonSpritesDump/refs/heads/main/sprites/sprite_${imageId}_s0.webp`
          : `https://raw.githubusercontent.com/blai30/PokemonSpritesDump/refs/heads/main/sprites/sprite_${imageId}_${variant.name}_s0.webp`,
        speciesSlug: specie.name,
        slug: variant.name,
        species: getEnglishName(specie.names, ''),
        variant: variantName ?? '',
        isDefault: variant.is_default ?? false,
        genera: getEnglishName(specie.genera, '', 'genus'),
        generation: GenerationNumber[specie.generation.name] ?? 0,
        type1: TypeLabels[variant.types[0]!.type.name as TypeKey],
        type2:
          variant.types.length > 1
            ? TypeLabels[variant.types[1]?.type.name as TypeKey]
            : undefined,
        height: variant.height / 10,
        weight: variant.weight / 10,
        ability1:
          (abilitiesMap[variant.abilities[0]!.ability.name]?.name as string) ??
          variant.abilities[0]!.ability.name ??
          undefined,
        ability2:
          (abilitiesMap[variant.abilities[1]?.ability.name!]?.name as string) ??
          variant.abilities[1]?.ability.name ??
          undefined,
        abilityHidden:
          (abilitiesMap[
            variant.abilities.find((a) => a.is_hidden)?.ability.name!
          ]?.name as string) ??
          variant.abilities.find((a) => a.is_hidden)?.ability.name ??
          undefined,
        ability1Description:
          (abilitiesMap[variant.abilities[0]!.ability.name]
            ?.description as string) ??
          variant.abilities[0]!.ability.name ??
          '',
        ability2Description:
          (abilitiesMap[variant.abilities[1]?.ability.name!]
            ?.description as string) ??
          variant.abilities[1]?.ability.name ??
          '',
        abilityHiddenDescription:
          (abilitiesMap[
            variant.abilities.find((a) => a.is_hidden)?.ability.name!
          ]?.description as string) ??
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
        catchRate: specie.capture_rate,
        baseHappiness: specie.base_happiness,
        baseExp: variant.base_experience,
        totalExp: growthRatesMap[specie.growth_rate.name] ?? 0,
        growthRate: GrowthRateLabels[specie.growth_rate.name as GrowthRateKey],
        genderMale:
          specie.gender_rate >= 0
            ? 100 - (specie.gender_rate / 8) * 100
            : undefined,
        genderFemale:
          specie.gender_rate >= 0 ? (specie.gender_rate / 8) * 100 : undefined,
        genderless: specie.gender_rate === -1,
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
      return row
    })
  })
  console.log('Rows built.')

  // Convert rows to CSV with kebab-case headers, overwrite existing file
  console.log('Writing CSV file...')
  const csvHeaders = Object.keys(rows[0]!).map(toKebab).join(',')
  const csvRows = rows.map((row) => Object.values(row).map(csvEscape).join(','))
  const csvContent = [csvHeaders, ...csvRows].join('\n')
  const outputPath = path.join(__dirname, 'out', 'pokemon-cms.csv')
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, csvContent)

  console.log(`CSV file created at ${outputPath}`)
  console.log(`Total rows processed: ${rows.length}`)
  console.log(`Elapsed time: ${process.uptime().toFixed(2)} seconds`)
}

await main()
