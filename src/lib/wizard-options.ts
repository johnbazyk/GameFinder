export const WIZARD_QUESTIONS = [
  { key: "players", title: "How many people are playing?", hint: "Count everyone at the table." },
  {
    key: "age",
    title: "How old is the youngest player?",
    hint: "Younger-rated games still qualify.",
  },
  {
    key: "time",
    title: "How much time do you want to play?",
    hint: "We'll match the listed playtime for each game.",
  },
  {
    key: "vibe",
    title: "What kind of game are you in the mood for?",
    hint: "Choose as many as you want, or skip this step.",
  },
] as const;

export const TIME_OPTIONS = [
  { label: "10 minutes or less", value: 10, over60: false },
  { label: "15 minutes or less", value: 15, over60: false },
  { label: "30 minutes or less", value: 30, over60: false },
  { label: "45 minutes or less", value: 45, over60: false },
  { label: "60 minutes or less", value: 60, over60: false },
  { label: "More than 60 minutes", value: null, over60: true },
] as const;
