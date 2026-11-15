// One scene unit is one metre. Estimated values describe this study, not flight hardware.
export const dimensions = {
  height: { value: 52, status: 'published', source: 'NASA 2026 approximate 171 ft vehicle height' },
  diameter: { value: 9, status: 'published', source: 'NASA Engineering 2024 nominal HLS diameter' },
  innerRadius: { value: 4.2, status: 'estimated', source: 'Visual shell allowance; not a pressure wall measurement' },
  bodyBottom: { value: 2.4, status: 'estimated', source: 'Landing gear clearance in this model' },
  bodyTop: { value: 43.6, status: 'estimated', source: 'Nose base matched to the NASA/SpaceX lunar-surface render (nose about 0.93 D tall)' },
  bandBottom: { value: 34.4, status: 'estimated', source: 'Lower edge of the dark crew/garage band in the NASA/SpaceX render' },
  noseProfile: { value: { base: 43.6, tip: 52, baseRadius: 4.5, tipRadius: 0.85, exponent: 0.75 }, status: 'estimated', source: 'Blunt ogive: r = tipR + (baseR - tipR) * s^0.75, s = 1 at the base; matched to the NASA/SpaceX render' },
  elevatorBoarding: { value: 35.1, status: 'published', source: 'NASA OIG 2026 approximate 115 ft lift boarding level' },
  decks: { value: [35.1,38.0,40.9,43.8], status: 'estimated', source: 'Four walkable model decks, 2.9 m apart; the top deck sits inside the nose base' },
  deckSpacing: { value: 2.9, status: 'estimated', source: 'Floor-to-floor height; 2.72 m clear under a 0.18 m slab' },
  floorThickness: { value: 0.18, status: 'estimated', source: 'Model structural slab' },
  stairCenter: { value: [0,0.3], status: 'estimated', source: 'Forward offset protects garage route' },
  stairOpeningRadius: { value: 1.5, status: 'estimated', source: 'Three-metre central opening' },
  stairInnerRadius: { value: 0.43, status: 'estimated', source: 'Inner stair edge' },
  stairOuterRadius: { value: 1.47, status: 'estimated', source: 'Stair tread outer edge' },
  stairRisers: { value: 18, status: 'estimated', source: '0.161 m rise per tread over 2.9 m' },
  airlockCount: { value: 2, status: 'published', source: 'SpaceX HLS update' },
  airlockVolume: { value: 13, status: 'published', source: 'SpaceX approximate volume for each airlock' },
  airlockClearSize: { value: [2,2.83,2.3], status: 'estimated', source: '13.02 cubic metre walkable rectangular volume' },
  hatchClearSize: { value: [1.2,2.15], status: 'estimated', source: 'Suited-person model opening, larger than 1.8 m avatar' },
  humanHeight: { value: 1.8, status: 'estimated', source: 'Future first-person avatar reference' },
  liftFootprint: { value: [2.6,2.2], status: 'estimated', source: 'Two-suited-person visual concept' },
  legPadRadius: { value: 7, status: 'estimated', source: 'Concept-art spread' },
  windows: { value: { centersDeg: [-38,-19,0,19,38], bottom: 41.55, top: 42.75, widthDeg: 13 }, status: 'estimated', source: 'SpaceX/NASA artist images; count and position unreleased' },
  controlSeats: { value: 4, status: 'observed', source: 'Four visible positions in SpaceX cabin artist image' },
  berthPods: { value: 4, status: 'estimated', source: 'Habitation layout choice; no published bunk count' },
  pressurizedVolume: { value: 600, status: 'published', source: 'SpaceX says more than 600 cubic metres combined; coarse check only' }
};

export const deckNames = ['A · EVA / Garage', 'B · Systems / Science', 'C · Flight Deck', 'D · Habitation'];
