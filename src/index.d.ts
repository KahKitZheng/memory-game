type Answer = {
  index: number;
  name: string;
};

type GameState = "idle" | "start" | "waiting" | "end";

type Person = {
  name: string;
  firstName: string;
  image: string;
};

type LeaderBoardUser = {
  id: number;
  createdAt: string;
  name: string;
  guesses: number;
  time: number;
  answers: number;
};
