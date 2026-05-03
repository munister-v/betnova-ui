import styled from "styled-components";
import BANNER_IMG from "../../../assets/images/banner-image.png";

export const StyledBanner = styled.div`
  background-image:
    linear-gradient(135deg, rgba(139, 92, 246, 0.55) 0%, rgba(236, 72, 153, 0.45) 50%, rgba(245, 158, 11, 0.5) 100%),
    url(${BANNER_IMG});
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  box-shadow:
    0 12px 40px rgba(139, 92, 246, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.06) inset;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.12), transparent 50%);
    pointer-events: none;
  }

  .main-heading {
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  }

  .main-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 36px 0px 36px 3.5%;
    gap: 1.5rem;
  }

  .main-heading {
    max-width: 368px;
    color: #fff;
    text-align: center;
    font-size: 18px;
    font-style: normal;
    font-weight: 400;
    line-height: 28.8px;
  }

  .or-join-with {
    width: 73px;
    color: #b1b6c6;
    text-align: center;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 16.8px;
  }

  .social-media-container {
    display: flex;
    padding: 12px 16px;
    justify-content: center;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .side-text {
    padding: 36px 7.5% 36px 0;
    align-self: flex-end;
  }

  .leverage-text {
    color: #fff;
    text-align: center;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 16.8px;
  }

  .small-text {
    color: #b1b6c6;
    text-align: center;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 14.4px;
  }
`;
