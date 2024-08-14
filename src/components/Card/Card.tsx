import "./Card.scss";

type CardProps = {
  person: Person;
  isFlipped: boolean;
  onClick: () => void;
  isCorrect?: boolean;
  clickable: boolean;
};

export default function Card(props: Readonly<CardProps>) {
  const { person, isFlipped, onClick, isCorrect, clickable } = props;

  return (
    <div className={`card-container ${isCorrect ? "correct" : ""}`}>
      <div
        className={`card ${isFlipped ? "flipped" : ""} ${
          clickable ? "clickable" : ""
        }`}
      >
        <div className="back" onClick={onClick}>
          <span className="unknown">?</span>
        </div>
        <div className="front">
          <div className="cover">
            <img className="image" src={person.img} alt={person.name} />
          </div>
          <p className="name">{person.firstName}</p>
        </div>
      </div>
    </div>
  );
}
