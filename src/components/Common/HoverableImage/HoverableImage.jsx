import React from "react";
import { Link } from "react-router-dom";
import { StyledHoverableImage } from "./styles";

const HoverableImage = ({ src, alt, to = "/slots" }) => {
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <StyledHoverableImage>
        <img src={src} alt={alt} className="image-card" />
      </StyledHoverableImage>
    </Link>
  );
};

export default HoverableImage;
