import { useEffect, useState } from "react";
import { shuffle } from "./utils/shuffle";
import { FAQTA_EMPLOYEES } from "./mock-data/faqta-employees";
import Card from "./components/Card/Card";
import "./App.scss";

function App() {
  const [revealCardIndex, setRevealCardIndex] = useState([-1]);
  const [gameState, setGameState] = useState("idle");
  const [isAllCardsFlipped, setIsAllCardsFlipped] = useState(false);
  const [time, setTime] = useState(0);
  const [chosenCards, setChosenCards] = useState<
    { index: number; name: string }[]
  >([]);
  const [correctCards, setCorrectCards] = useState<{ index: number }[]>([]);
  const [people, setPeople] = useState<Person[]>(
    shuffle([...FAQTA_EMPLOYEES, ...FAQTA_EMPLOYEES])
  );
  const [guesses, setGuesses] = useState(0);

  useEffect(() => {
    if (time > 3) {
      setIsAllCardsFlipped(false);
    }

    const interval = setTimeout(() => {
      if (gameState === "start") {
        return setTime((prevTime) => prevTime + 1);
      }
      if (gameState === "end") {
        return () => clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, time]);

  useEffect(() => {
    if (gameState !== "idle") {
      return setRevealCardIndex([]);
    }

    const interval = setInterval(() => {
      const randomIndices = Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * people.length)
      );
      setRevealCardIndex(randomIndices);
    }, 3000);

    return () => clearInterval(interval);
  }, [gameState, people.length]);

  useEffect(() => {
    if (gameState === "end") {
      return;
    }

    if (chosenCards.length === 2) {
      setGameState("waiting");
      setGuesses((prevGuesses) => prevGuesses + 1);

      const [firstCard, secondCard] = chosenCards;

      if (firstCard.name === secondCard.name) {
        const newList = [...correctCards, firstCard, secondCard];

        setCorrectCards(newList);
        setChosenCards([]);

        if (newList.length === people.length) {
          setGameState("end");
        } else {
          setGameState("start");
        }
      }

      const nextTurn = setTimeout(() => {
        setChosenCards([]);
        setGameState("start");
      }, 800);

      // need to remove nextTurn timeout, otherwise game will keep running
      return () => clearTimeout(nextTurn);
    }
  }, [chosenCards, gameState]);

  function renderTimeInMinutesAndSeconds() {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  }

  function startGame() {
    setGameState("start");
    setIsAllCardsFlipped(true);
  }

  function resetGame() {
    setGameState("idle");
    setTime(0);
    setGuesses(0);
    setChosenCards([]);
    setCorrectCards([]);
    setIsAllCardsFlipped(false);
    setPeople(shuffle([...FAQTA_EMPLOYEES, ...FAQTA_EMPLOYEES]));
  }

  function isCardFlipped(cardIndex: number) {
    // game state is idle
    if (revealCardIndex.includes(cardIndex)) {
      return true;
    }
    // game state is started
    if (isAllCardsFlipped) {
      return true;
    }
    // card is already chosen
    if (chosenCards.find((card) => card.index === cardIndex)) {
      return true;
    }
    if (correctCards.find((card) => card.index === cardIndex)) {
      return true;
    }

    return false;
  }

  return (
    <div>
      <header className="header">
        <h1 className="title">Memory game</h1>
        <div className="game-settings">
          <div className="group game">
            <p>Time: {renderTimeInMinutesAndSeconds()}</p>
            <p>Guesses: {guesses}</p>
          </div>
          <div className="group">
            <button
              className="button primary"
              onClick={startGame}
              disabled={gameState !== "idle"}
            >
              Start game
            </button>
            <button
              className="button secondary"
              onClick={resetGame}
              disabled={gameState === "idle"}
            >
              Reset game
            </button>
          </div>
        </div>
      </header>
      <div className="user-grid">
        {people.map((person, index) => (
          <Card
            key={index}
            person={person}
            isFlipped={isCardFlipped(index)}
            isCorrect={
              correctCards.find((card) => card.index === index) ? true : false
            }
            clickable={gameState === "start"}
            onClick={() => {
              if (gameState !== "start") {
                return;
              }

              if (chosenCards.length === 2) {
                return;
              }

              setChosenCards([
                ...chosenCards,
                { index: index, name: person.name },
              ]);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
