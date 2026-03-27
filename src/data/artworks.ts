export interface Artwork {
  id: string;
  number: string;
  theoryName: string;
  description: string;
  thumbnailUrl?: string;
  liveUrl: string;
  detailedExplanation: string;
}

export const artworks: Artwork[] = [
  {
    id: "conformity",
    number: "/01",
    theoryName: "Conformity",
    description: "Visualizing the Asch conformity experiments through interactive collective behavior.",
    liveUrl: "https://example.com/conformity", 
    detailedExplanation: "In the 1950s, Solomon Asch conducted a series of psychological experiments demonstrating the degree to which an individual's own opinions are influenced by those of a majority group. This interactive artwork explores how cursor movements in a shared digital space naturally conform to the perceived 'group' average."
  },
  {
    id: "bystander-effect",
    number: "/02",
    theoryName: "Bystander Effect",
    description: "An interface that becomes less responsive as more 'spectators' are added to the room.",
    liveUrl: "https://example.com/bystander", 
    detailedExplanation: "The bystander effect is a social psychological theory that states that individuals are less likely to offer help to a victim when there are other people present. This piece demonstrates diffused responsibility: the UI only responds when you are alone."
  },
  {
    id: "cognitive-dissonance",
    number: "/03",
    theoryName: "Cognitive Dissonance",
    description: "A dual-choice paradox rendering visual discomfort when conflicting actions are taken.",
    liveUrl: "https://example.com/dissonance",
    detailedExplanation: "Cognitive dissonance occurs when a person holds contradictory beliefs, ideas, or values, and is typically experienced as psychological stress. This web experiment forces conflicting interactions, exploring the tension of holding two opposing states."
  }
];
