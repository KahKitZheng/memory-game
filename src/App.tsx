import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { shuffle } from "./utils/shuffle";
import { FAQTA_EMPLOYEES } from "./mock-data/faqta-employees";
import { FaRankingStar } from "react-icons/fa6";
import { IoIosClose } from "react-icons/io";
import { Analytics } from "@vercel/analytics/react";
import Card from "./components/Card/Card";
import "./App.scss";

const supabase = createClient(
  import.meta.env.VITE_PROJECT_URL,
  import.meta.env.VITE_ANON_KEY
);

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
  const [leaderboard, setLeaderboard] = useState<LeaderBoardUser[]>([]);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const FLIP_IDLE_CARDS = 16;

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
      const randomIndices = Array.from({ length: FLIP_IDLE_CARDS }, () =>
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
          setLeaderboardVisible(true);
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
    setIsSubmitted(false);
    setLeaderboardVisible(false);
    setUsername("");
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

  function calcToMinutesAndSeconds(time: number) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  }

  async function getLeaderBoard() {
    const { data } = await supabase.from("leaderboard").select("*");
    setLeaderboard(data as LeaderBoardUser[]);
  }

  async function submitScore() {
    await supabase
      .from("leaderboard")
      .insert([{ name: username, time: time, guesses: guesses }]);

    getLeaderBoard();
    setIsSubmitted(true);
  }

  useEffect(() => {
    if (gameState === "idle" || gameState === "end") {
      getLeaderBoard();
    }
  }, [gameState]);

  return (
    <div>
      <Analytics />
      <header className="header">
        <div>
          <h1 className="title">Memory game</h1>
        </div>
        <div className="game-settings">
          <div className="group game">
            <p>Time: {renderTimeInMinutesAndSeconds()}</p>
            <p>Guesses: {guesses}</p>
          </div>
          <div className="group">
            <button
              className="button icon secondary"
              onClick={() => {
                setLeaderboardVisible(!leaderboardVisible);
                getLeaderBoard();
              }}
            >
              <FaRankingStar />
            </button>
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

      {leaderboardVisible && (
        <div>
          <button
            className="shade"
            onClick={() => setLeaderboardVisible(false)}
          />
          <div className="leaderboard">
            <header className="leaderboard-header">
              <p className="leaderboard-title">Leaderboard</p>
              <button
                onClick={() => setLeaderboardVisible(false)}
                className="leaderboard-close"
              >
                <IoIosClose />
              </button>
            </header>
            <ol className="leaderboard-list">
              {leaderboard.length ? (
                leaderboard
                  .sort((a, b) => a.time - b.time)
                  .map((user, index) => (
                    <li key={index + 1} className="row">
                      <p>
                        {index + 1}. {user.name}
                      </p>
                      <p className="text-right">
                        {calcToMinutesAndSeconds(user.time)}s
                      </p>
                      <p className="text-right">{user.guesses} guesses</p>
                    </li>
                  ))
              ) : (
                <p className="empty-leaderboard">
                  No one has submitted their score yet
                </p>
              )}
            </ol>

            {gameState === "end" && !isSubmitted && (
              <div className="leaderboard-form">
                <div className="player-results">
                  <div className="row">
                    <input
                      type="text"
                      placeholder="Enter your name"
                      className="leaderboard-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <p className="text-right">
                      {calcToMinutesAndSeconds(time)}s
                    </p>
                    <p className="text-right">{guesses} guesses</p>
                  </div>
                </div>
                <button className="button primary" onClick={submitScore}>
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
