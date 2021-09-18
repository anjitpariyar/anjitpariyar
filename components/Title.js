import React from "react";
import PropTypes from "prop-types";

const Title = ({ text, arc, radius, className }) => {
  const characters = text.split("");
  const degree = arc / characters.length;
  const myStyle = {
    margin: 0,
    lineHeight: 1.15,
    textAlign: "center",
    marginBottom: "0.5em",
    position: "relative",
    height: `${radius * 2}px`,
    width: `${radius * 2}px`,
  };

  return (
    <h2 className={className} style={myStyle}>
      {characters.map((char, i) => (
        <span
          key={`heading-span-${i}`}
          style={{
            height: `${radius}px`,
            transform: `rotate(${degree * i - arc / 2}deg)`,
            transformOrigin: `0 ${radius}px 0`,
            position: "absolute",
          }}
        >
          {char}
        </span>
      ))}
    </h2>
  );
};

Title.propTypes = {
  text: PropTypes.string.isRequired,
  arc: PropTypes.number, // how curved do you want the text
  radius: PropTypes.number, // how big do you want the curve
};

Title.defaultProps = {
  arc: 120,
  radius: 400,
  text: "Test",
  className: "test",
};

export default Title;
