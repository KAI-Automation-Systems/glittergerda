export const themes = {
  foutgoud: {
    label: "Fout maar goud",
    colors: "hot pink, purple, orange and gold",
    scene: "an outrageously confident retro glamour icon posing in a deliberately tacky internet-card collage",
  },
  gerda: {
    label: "Gerda deluxe",
    colors: "fuchsia, red, gold and leopard print",
    scene: "a glamorous middle-aged Dutch internet auntie with teased hair, big sunglasses, prosecco and unstoppable confidence",
  },
  liefde: {
    label: "Liefde met lakschade",
    colors: "ruby red, hot pink, silver and purple",
    scene: "an absurdly romantic couple surrounded by velvet roses, heart balloons and dramatic poses",
  },
  feest: {
    label: "Feestbeest premium",
    colors: "rainbow neon, gold, pink and electric blue",
    scene: "a wildly overdressed party icon with a crooked party hat, cake, confetti and disco energy",
  },
  passief: {
    label: "Passief-agressief pareltje",
    colors: "acid green, hot pink, black and gold",
    scene: "a smiling but visibly unimpressed glamour icon raising one eyebrow and holding a fancy drink",
  },
  beesten: {
    label: "Beestenboel met attitude",
    colors: "turquoise, violet, pink and silver",
    scene: "an overdressed cat and dog wearing tiny crowns and posing like international celebrities",
  },
  bloemen: {
    label: "Bloemetjes & drama",
    colors: "rose pink, lilac, sky blue and gold",
    scene: "a spectacular bouquet of roses, butterflies, clouds and a dramatic glowing sunrise",
  },
  ontspoord: {
    label: "Volledig ontspoord",
    colors: "every neon rainbow color with gold",
    scene: "a tiny unicorn riding a disco ball past a UFO while flamingos dance under a rainbow",
  },
} as const;

export type ThemeKey = keyof typeof themes;

export function buildImagePrompt(theme: ThemeKey, chaos: number) {
  const choice = themes[theme];
  return [
    "Create square base artwork for an authentic 2006-era animated Dutch social-network glitter card.",
    "Main subject: " + choice.scene + ".",
    "Palette: " + choice.colors + ".",
    "Use a deliberately tacky Hyves, MySpace and Blingee-era photo collage aesthetic.",
    "Include glossy gradients, hearts, cheap airbrushed edges and obvious cutout compositing.",
    "Keep the lower 32 percent visually calm and dark enough for text to be overlaid later.",
    chaos >= 3 ? "Make it gloriously excessive and camp." : "Keep the composition playful but readable.",
    "Do not include any words, letters, logos, watermarks or existing copyrighted characters.",
    "Do not imitate a real person's exact face.",
  ].join(" ");
}
