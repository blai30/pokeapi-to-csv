export type Row = {
  dexId?: number | null
  imageUrl?: string | null
  speciesSlug?: string | null
  slug?: string | null
  species?: string | null
  variant?: string | null
  isDefault?: boolean | null
  genera?: string | null
  generation?: number | null
  type1?: string | null
  type2?: string | null
  height?: number | null
  weight?: number | null
  ability1?: string | null
  ability2?: string | null
  abilityHidden?: string | null
  ability1Description?: string | null
  ability2Description?: string | null
  abilityHiddenDescription?: string | null
  hp?: number | null
  attack?: number | null
  defense?: number | null
  specialAttack?: number | null
  specialDefense?: number | null
  speed?: number | null
  evHp?: number | null
  evAttack?: number | null
  evDefense?: number | null
  evSpecialAttack?: number | null
  evSpecialDefense?: number | null
  evSpeed?: number | null
  catchRate?: number | null
  baseHappiness?: number | null
  baseExp?: number | null
  totalExp?: number | null
  growthRate?: string | null
  genderMale?: number | null
  genderFemale?: number | null
  genderless?: boolean | null
  eggCycles?: number | null
  eggGroup1?: string | null
  eggGroup2?: string | null
  color?: string | null
  shape?: string | null
  category?: string | null
}

export const GenerationNumber: Record<string, number> = {
  'generation-i': 1,
  'generation-ii': 2,
  'generation-iii': 3,
  'generation-iv': 4,
  'generation-v': 5,
  'generation-vi': 6,
  'generation-vii': 7,
  'generation-viii': 8,
  'generation-ix': 9,
}

export enum StatKey {
  Hp = 'hp',
  Attack = 'attack',
  Defense = 'defense',
  SpecialAttack = 'special-attack',
  SpecialDefense = 'special-defense',
  Speed = 'speed',
}

export const StatLabels: Record<StatKey, string> = {
  [StatKey.Hp]: 'HP',
  [StatKey.Attack]: 'Attack',
  [StatKey.Defense]: 'Defense',
  [StatKey.SpecialAttack]: 'Sp. Atk',
  [StatKey.SpecialDefense]: 'Sp. Def',
  [StatKey.Speed]: 'Speed',
}

export const StatLabelsFull: Record<StatKey, string> = {
  [StatKey.Hp]: 'HP',
  [StatKey.Attack]: 'Attack',
  [StatKey.Defense]: 'Defense',
  [StatKey.SpecialAttack]: 'Special Attack',
  [StatKey.SpecialDefense]: 'Special Defense',
  [StatKey.Speed]: 'Speed',
}

export enum DamageClassKey {
  Physical = 'physical',
  Special = 'special',
  Status = 'status',
}

export const DamageClassLabels: Record<DamageClassKey, string> = {
  [DamageClassKey.Physical]: 'Physical',
  [DamageClassKey.Special]: 'Special',
  [DamageClassKey.Status]: 'Status',
}

export enum TypeKey {
  Normal = 'normal',
  Fighting = 'fighting',
  Flying = 'flying',
  Poison = 'poison',
  Ground = 'ground',
  Rock = 'rock',
  Bug = 'bug',
  Ghost = 'ghost',
  Steel = 'steel',
  Fire = 'fire',
  Water = 'water',
  Grass = 'grass',
  Electric = 'electric',
  Psychic = 'psychic',
  Ice = 'ice',
  Dragon = 'dragon',
  Dark = 'dark',
  Fairy = 'fairy',
}

export const TypeLabels: Record<TypeKey, string> = {
  [TypeKey.Normal]: 'Normal',
  [TypeKey.Fighting]: 'Fighting',
  [TypeKey.Flying]: 'Flying',
  [TypeKey.Poison]: 'Poison',
  [TypeKey.Ground]: 'Ground',
  [TypeKey.Rock]: 'Rock',
  [TypeKey.Bug]: 'Bug',
  [TypeKey.Ghost]: 'Ghost',
  [TypeKey.Steel]: 'Steel',
  [TypeKey.Fire]: 'Fire',
  [TypeKey.Water]: 'Water',
  [TypeKey.Grass]: 'Grass',
  [TypeKey.Electric]: 'Electric',
  [TypeKey.Psychic]: 'Psychic',
  [TypeKey.Ice]: 'Ice',
  [TypeKey.Dragon]: 'Dragon',
  [TypeKey.Dark]: 'Dark',
  [TypeKey.Fairy]: 'Fairy',
}

export enum EggGroupKey {
  Monster = 'monster',
  Water1 = 'water1',
  Bug = 'bug',
  Flying = 'flying',
  Ground = 'ground',
  Fairy = 'fairy',
  Plant = 'plant',
  Humanshape = 'humanshape',
  Water3 = 'water3',
  Mineral = 'mineral',
  Indeterminate = 'indeterminate',
  Water2 = 'water2',
  Ditto = 'ditto',
  Dragon = 'dragon',
  NoEggs = 'no-eggs',
}

export const EggGroupLabels: Record<EggGroupKey, string> = {
  [EggGroupKey.Monster]: 'Monster',
  [EggGroupKey.Water1]: 'Water 1',
  [EggGroupKey.Bug]: 'Bug',
  [EggGroupKey.Flying]: 'Flying',
  [EggGroupKey.Ground]: 'Ground',
  [EggGroupKey.Fairy]: 'Fairy',
  [EggGroupKey.Plant]: 'Plant',
  [EggGroupKey.Humanshape]: 'Human-Like',
  [EggGroupKey.Water3]: 'Water 3',
  [EggGroupKey.Mineral]: 'Mineral',
  [EggGroupKey.Indeterminate]: 'Amorphous',
  [EggGroupKey.Water2]: 'Water 2',
  [EggGroupKey.Ditto]: 'Ditto',
  [EggGroupKey.Dragon]: 'Dragon',
  [EggGroupKey.NoEggs]: 'Undiscovered',
}

export enum GrowthRateKey {
  Slow = 'slow',
  Medium = 'medium',
  Fast = 'fast',
  MediumSlow = 'medium-slow',
  SlowThenVeryFast = 'slow-then-very-fast',
  FastThenVerySlow = 'fast-then-very-slow',
}

export const GrowthRateLabels: Record<GrowthRateKey, string> = {
  [GrowthRateKey.Slow]: 'Slow',
  [GrowthRateKey.Medium]: 'Medium',
  [GrowthRateKey.Fast]: 'Fast',
  [GrowthRateKey.MediumSlow]: 'Medium Slow',
  [GrowthRateKey.SlowThenVeryFast]: 'Erratic',
  [GrowthRateKey.FastThenVerySlow]: 'fluctuating',
}

export enum ColorKey {
  Black = 'black',
  Blue = 'blue',
  Brown = 'brown',
  Gray = 'gray',
  Green = 'green',
  Pink = 'pink',
  Purple = 'purple',
  Red = 'red',
  White = 'white',
  Yellow = 'yellow',
}

export const ColorLabels: Record<ColorKey, string> = {
  [ColorKey.Black]: 'Black',
  [ColorKey.Blue]: 'Blue',
  [ColorKey.Brown]: 'Brown',
  [ColorKey.Gray]: 'Gray',
  [ColorKey.Green]: 'Green',
  [ColorKey.Pink]: 'Pink',
  [ColorKey.Purple]: 'Purple',
  [ColorKey.Red]: 'Red',
  [ColorKey.White]: 'White',
  [ColorKey.Yellow]: 'Yellow',
}

export enum ShapeKey {
  Ball = 'ball',
  Squiggle = 'squiggle',
  Fish = 'fish',
  Arms = 'arms',
  Blob = 'blob',
  Upright = 'upright',
  Legs = 'legs',
  Quadruped = 'quadruped',
  Wings = 'wings',
  Tentacles = 'tentacles',
  Heads = 'heads',
  Humanoid = 'humanoid',
  BugWings = 'bug-wings',
  Armor = 'armor',
}

export const ShapeLabels: Record<ShapeKey, string> = {
  [ShapeKey.Ball]: 'Ball',
  [ShapeKey.Squiggle]: 'Squiggle',
  [ShapeKey.Fish]: 'Fish',
  [ShapeKey.Arms]: 'Arms',
  [ShapeKey.Blob]: 'Blob',
  [ShapeKey.Upright]: 'Upright',
  [ShapeKey.Legs]: 'Legs',
  [ShapeKey.Quadruped]: 'Quadruped',
  [ShapeKey.Wings]: 'Wings',
  [ShapeKey.Tentacles]: 'Tentacles',
  [ShapeKey.Heads]: 'Heads',
  [ShapeKey.Humanoid]: 'Humanoid',
  [ShapeKey.BugWings]: 'Bug wings',
  [ShapeKey.Armor]: 'Armor',
}
