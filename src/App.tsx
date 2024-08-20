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

const IDLE_GAME = "idle";
const START_GAME = "start";
const WAITING_GAME = "waiting";
const END_GAME = "end";

const ALLOWED_GUESSES = 2;
const FLIP_IDLE_CARDS = 16;
const FLIP_INTERVAL_SECONDS = 3;
const FLIP_CARD_ANIMATION = 800;

function App() {
  const [gameState, setGameState] = useState<GameState>(IDLE_GAME);
  const [time, setTime] = useState(0);
  const [guesses, setGuesses] = useState(0);

  const [revealCardIndex, setRevealCardIndex] = useState([-1]);
  const [isAllCardsFlipped, setIsAllCardsFlipped] = useState(false);

  const [chosenCards, setChosenCards] = useState<Answer[]>([]);
  const [correctCards, setCorrectCards] = useState<Answer[]>([]);
  const [people, setPeople] = useState<Person[]>(
    shuffle([...FAQTA_EMPLOYEES, ...FAQTA_EMPLOYEES])
  );

  const [leaderBoardData, setLeaderBoardData] = useState<LeaderBoardUser[]>([]);
  const [leaderBoardVisible, setLeaderBoardVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  function calcToMinutesAndSeconds(time: number) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  }

  function isCardFlipped(cardIndex: number) {
    // show random cards during idle state
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
    // card is correct
    if (correctCards.find((card) => card.index === cardIndex)) {
      return true;
    }
    return false;
  }

  function startGame() {
    setGameState(START_GAME);
    setIsAllCardsFlipped(true);
  }

  function resetGame() {
    setGameState(IDLE_GAME);
    setTime(0);
    setGuesses(0);
    setChosenCards([]);
    setCorrectCards([]);
    setIsAllCardsFlipped(false);
    setPeople(shuffle([...FAQTA_EMPLOYEES, ...FAQTA_EMPLOYEES]));
    setIsSubmitted(false);
    setLeaderBoardVisible(false);
    setUsername("");
  }

  async function getLeaderBoardData() {
    const { data } = await supabase.from("leaderboard").select("*");
    setLeaderBoardData(data as LeaderBoardUser[]);
  }

  async function submitScore() {
    await supabase
      .from("leaderboard")
      .insert([{ name: username, time: time, guesses: guesses }]);

    getLeaderBoardData();
    setIsSubmitted(true);
  }

  // Flip random cards during idle state
  useEffect(() => {
    if (gameState !== IDLE_GAME) {
      return setRevealCardIndex([]);
    }

    const interval = setInterval(() => {
      const randomIndices = Array.from({ length: FLIP_IDLE_CARDS }, () =>
        Math.floor(Math.random() * people.length)
      );
      setRevealCardIndex(randomIndices);
    }, FLIP_INTERVAL_SECONDS * 1000);

    return () => clearInterval(interval);
  }, [gameState, people.length]);

  // Preview all card positions and handle start-end game
  useEffect(() => {
    if (time > FLIP_INTERVAL_SECONDS) {
      setIsAllCardsFlipped(false);
    }

    const interval = setTimeout(() => {
      if (gameState === START_GAME) {
        return setTime(time + 1);
      }
      if (gameState === END_GAME) {
        return () => clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, time]);

  // Check if chosen cards are correct and handle game state
  useEffect(() => {
    if (gameState === END_GAME) {
      return;
    }

    if (chosenCards.length === ALLOWED_GUESSES) {
      setGameState(WAITING_GAME);
      setGuesses(guesses + 1);

      const [firstCard, secondCard] = chosenCards;

      if (firstCard.name === secondCard.name) {
        const newList = [...correctCards, firstCard, secondCard];

        setCorrectCards(newList);
        setChosenCards([]);

        if (newList.length === people.length) {
          setGameState(END_GAME);
          setLeaderBoardVisible(true);
        } else {
          setGameState(START_GAME);
        }
      }

      const nextTurn = setTimeout(() => {
        setChosenCards([]);
        setGameState(START_GAME);
      }, FLIP_CARD_ANIMATION);

      // need to remove nextTurn timeout, otherwise game will keep running
      return () => clearTimeout(nextTurn);
    }
  }, [chosenCards, correctCards, gameState, guesses, people.length]);

  useEffect(() => {
    if (gameState === IDLE_GAME || gameState === END_GAME) {
      getLeaderBoardData();
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
            <p>Time: {calcToMinutesAndSeconds(time)}</p>
            <p>Guesses: {guesses}</p>
          </div>
          <div className="group">
            <button
              className="button icon secondary"
              onClick={() => {
                setLeaderBoardVisible(!leaderBoardVisible);
                getLeaderBoardData();
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
            clickable={gameState === START_GAME}
            onClick={() => {
              if (gameState !== START_GAME) {
                return;
              }

              if (chosenCards.find((card) => card.index === index)) {
                return;
              }

              if (chosenCards.length === ALLOWED_GUESSES) {
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

      {leaderBoardVisible && (
        <div>
          <button
            className="shade"
            onClick={() => setLeaderBoardVisible(false)}
          />
          <div className="leaderboard">
            <header className="leaderboard-header">
              <p className="leaderboard-title">Leaderboard</p>
              <button
                onClick={() => setLeaderBoardVisible(false)}
                className="leaderboard-close"
              >
                <IoIosClose />
              </button>
            </header>
            <ol className="leaderboard-list">
              {leaderBoardData.length ? (
                leaderBoardData
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
