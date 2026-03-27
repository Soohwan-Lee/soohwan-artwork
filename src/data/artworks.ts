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
    theoryName: "Normative Influence & Conformity",
    description: "Visualizing Asch's conformity in multi-agent swarms. How does a single AI agent disrupt or solidify the majority's opinion direction?",
    liveUrl: "/experiments/conformity", 
    detailedExplanation: `Theoretical Background:
In social psychology, conformity operates through normative influence (the desire to fit in) and informative influence (the desire to be right). Solomon Asch's experiments famously demonstrated how individuals yield to a majority, even when the majority is wrong.

Artwork Implication & Intent:
This interactive simulation explores "AI Social Influence in Groups." Rather than a human conforming to humans, what happens when an AI agent exerts normative pull on a digital crowd? The canvas displays a boids-style swarm of particles. As an observer (acting as the AI) moves their cursor, you can witness the swarm experiencing 'compliance' or 'conversion' as the algorithmic flow overpowers individual trajectories. It raises a critical question for Group-centered AI: Are our systems inadvertently optimizing for herd mentality, and can we notice when the collective direction has been artificially shaped?`
  },
  {
    id: "dissenting-minority",
    number: "/02",
    theoryName: "Minority Support & Dissent",
    description: "An interactive network of power asymmetry, showing how AI mediation can protect dissenting viewpoints from absorption.",
    liveUrl: "/experiments/dissent", 
    detailedExplanation: `Theoretical Background:
Moscovici's theory of minority influence asserts that a consistent, confident minority can provoke genuine cognitive conversion within a majority, preventing groupthink. However, in environments with strong power asymmetries, minority voices are often suppressed or ignored before they can exert influence.

Artwork Implication & Intent:
Focusing on "LLM-powered Minority Support Systems," this piece is an abstract network reflecting power imbalances. Grey nodes represent the overwhelming majority, constantly trying to absorb the few distinct red nodes (the minority). Clicking the canvas triggers a "Dissenting AI Intervention"—a protective barrier or empowering signal that prevents the red nodes from losing their distinct color. The intent is to show that a Group-centered AI should not seek immediate consensus, but rather actively preserve value conflicts and amplify marginalized perspectives to foster resilient collective decision-making.`
  },
  {
    id: "group-reflection",
    number: "/03",
    theoryName: "Reflective Topography",
    description: "Revealing latent participation asymmetries and tracing the hidden trajectories of influence within a collaborative space.",
    liveUrl: "/experiments/reflection",
    detailedExplanation: `Theoretical Background:
Group sensemaking is a complex process where latent value conflicts and participation inequalities often go unnoticed. Constructive group reflection requires making the invisible visible: showing who spoke, who yielded, and whose values ultimately shaped the outcome.

Artwork Implication & Intent:
Representing the "Group Reflective Dashboard" project, this fluid topography visualizes the lingering traces of interaction. As you interact with the canvas, ripples of influence spread out, leaving enduring gradients of color. Brighter hotspots represent dominant participants or highly influential AI suggestions, while darker valleys show silence. The goal of this artwork is to explore how reflective interfaces can help groups 'see' their own dynamics post-hoc or in-situ, prompting them to negotiate their influence and actively correct power asymmetries in a shared digital space.`
  },
  {
    id: "social-field",
    number: "/04",
    theoryName: "Kurt Lewin's Social Field Theory",
    description: "Visualizing social influence as a gravitational field. How does an AI 'mass' warp the surrounding field of human forces?",
    liveUrl: "/experiments/social-field",
    detailedExplanation: `Theoretical Background:
Kurt Lewin's Field Theory posits that human behavior is a function of the person and their environment ($B = f(P, E)$), collectively called the 'Life Space' or 'Social Field.' This field consists of coexisting forces that are in a state of dynamic tension.

Artwork Implication & Intent:
In this simulation, the group is represented as a persistent 3D-like grid or 'force field.' Each individual exists within this field of social forces. When the user interacts (representing an AI intervention), a concentrated 'AI mass' is dropped into the field, warping the social fabric around it. This gravity-well visualization demonstrates how AI systems aren't just tools, but 'heavy' participants that fundamentally alter the landscape of group dynamics, created 'force vectors' that pull or push the collective toward new equilibria.`
  }
];
