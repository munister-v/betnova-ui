import styled from "styled-components";

export const StyledRegisterModal = styled.div`
  .register-button {
    display: inline-flex;
    -webkit-box-align: center;
    align-items: center;
    -webkit-box-pack: center;
    justify-content: center;
    white-space: nowrap;
    transition: all 0.1s ease 0s;
    appearance: none;
    border: none;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    user-select: none;
    height: 40px;
    padding: 0px 24px;
    border-radius: 8px;
    font-weight: 800;
    font-style: normal;
    font-size: 14px;
    color: #fff;
    background: linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%);
    background-size: 200% 200%;
    box-shadow:
      0 8px 24px rgba(236, 72, 153, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset,
      0 1px 0 rgba(255, 255, 255, 0.25) inset;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    animation: btnShine 4s ease-in-out infinite;

    @keyframes btnShine {
      0%, 100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }
    width: 100%;
    margin: 24px 0px;

    &:hover {
      filter: brightness(110%);
    }
  }

  .form-group {
    margin-bottom: 18px;
    display: flex;
    flex-direction: column;
  }

  .form-label {
    color: #b1b6c6;
    font-size: 12px;
    font-style: normal;
    font-weight: bold;
    line-height: 14.4px;
    text-transform: uppercase;
    font-weight: bold;
  }

  .form-input {
    color: #fff;
    background-color: rgba(15, 17, 26, 0.55);
    width: 100%;
    height: 40px;
    padding-left: 15px;
    border-radius: 10px;
    margin-top: 11px;
  }

  .required {
    color: #ff4949;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 14.4px;
    text-transform: uppercase;
    font-weight: bold;
  }

  .toggle-fa-code-input {
    cursor: pointer;
    display: flex;
  }

  .toggle-fa-code-text {
    color: #b1b6c6;
    font-size: 14px;
    margin-right: 5px;
    cursor: pointer;
    font-weight: bold;
  }

  .toggle-fa-code-image {
    width: 7.133px;
    height: 5.599px;
    cursor: pointer;
    margin-top: 8px;
  }

  .fa-code-input {
    margin-bottom: 4px;
    color: #fff;
    background-color: rgba(15, 17, 26, 0.55);
    width: 100%;
    height: 40px;
    padding-left: 15px;
    border-radius: 10px;
    margin-top: 11px;
  }

  .required-message {
    color: #b1b6c6;
    font-size: 14px;
  }

  .spacing-inputs {
    margin-bottom: 24px;
  }

  .error-message {
    margin-top: 8px;
    color: rgb(255, 73, 73);
    font-size: 12px;
    font-weight: 500;
    font-style: normal;
  }

  .social-media-container {
    display: flex;
    padding: 12px 16px;
    justify-content: center;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .info-text-container {
    margin-top: 20px;
  }

  .info-text {
    color: #b1b6c6;
    font-size: 14px;
    margin-right: 5px;
    width: 100%;
  }
`;
