import React, { useContext, useState } from "react";
import { AppContext } from "../../../context/AppContext";
import { ReactComponent as PORTFOLIO_IMG } from "../../../assets/images/Frame (13).svg";
import CloseButtonModal from "../CloseButtonModal";
import Modal from "../Modal";
import CouponsReferralsContent from "./CouponsReferralsContent";
import DepositWithdrawContent from "./DepositWithdrawContent";
import BuyCryptoContent from "./BuyCryptoContent";
import NavigationCashier from "./NavigationCashier";
import { StyledCashierModal } from "./styles";

const CashierModal = ({ button }) => {
  const { selectedOptionCashier, updateCashierOption, isTabletScreen } = useContext(AppContext);

  const [isOpen, setIsOpen] = useState(false);
  const handleOpenModal = () => {
    if (button === "Buy Crypto") updateCashierOption("Buy Crypto");
    setIsOpen(true);
  };

  return (
    <>
      {!isTabletScreen ? (
        button === "Cashier" ? (
          <div
            onClick={handleOpenModal}
            style={{
              display: "inline-flex",
              padding: "10px 16px",
              alignItems: "flex-start",
              gap: "10px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #f59e0b, #ec4899)",
              boxShadow: "0 4px 20px rgba(245, 158, 11, 0.5), 0 0 0 1px rgba(245, 158, 11, 0.3)",
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(245, 158, 11, 0.7), 0 0 0 1px rgba(245, 158, 11, 0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(245, 158, 11, 0.5), 0 0 0 1px rgba(245, 158, 11, 0.3)"; }}
          >
            <p
              style={{
                color: "#fff",
                fontSize: "14px",
                fontWeight: "700",
                lineHeight: "16.8px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              💰 Cashier
            </p>
          </div>
        ) : (
          <div
            onClick={handleOpenModal}
            style={{
              display: "inline-flex",
              padding: "10px 16px",
              alignItems: "flex-start",
              gap: "10px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))",
              border: "1px solid rgba(139, 92, 246, 0.4)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(59, 130, 246, 0.35))"; e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))"; e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.4)"; }}
          >
            <p
              style={{
                color: "#fff",
                fontSize: "14px",
                fontWeight: "600",
                lineHeight: "16.8px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              ₿ Buy Crypto
            </p>
          </div>
        )
      ) : (
        <button className="button" onClick={handleOpenModal}>
          <PORTFOLIO_IMG />
        </button>
      )}

      <Modal maxWidth={805} isOpen={isOpen} onClose={setIsOpen}>
        <CloseButtonModal onClick={() => setIsOpen(false)} />
        <StyledCashierModal>
          <NavigationCashier />

          {selectedOptionCashier === "Deposit" ? (
            <DepositWithdrawContent option={selectedOptionCashier} />
          ) : null}

          {selectedOptionCashier === "Withdraw" ? (
            <DepositWithdrawContent option={selectedOptionCashier} />
          ) : null}

          {selectedOptionCashier === "Buy Crypto" ? (
            <BuyCryptoContent handleBack={() => updateCashierOption("Deposit")} />
          ) : null}

          {selectedOptionCashier === "Coupons" ? (
            <CouponsReferralsContent option={selectedOptionCashier} />
          ) : null}

          {selectedOptionCashier === "Referrals" ? (
            <CouponsReferralsContent option={selectedOptionCashier} />
          ) : null}
        </StyledCashierModal>
      </Modal>
    </>
  );
};

export default CashierModal;
