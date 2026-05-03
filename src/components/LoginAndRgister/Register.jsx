import { useFormik } from "formik";
import React, { useState } from "react";
import * as Yup from "yup";
import { ReactComponent as STEAM } from "../../assets/images/Frame (22).svg";
import { ReactComponent as TWITCH } from "../../assets/images/Frame (23).svg";
import { ReactComponent as METAMASK } from "../../assets/images/Frame (24).svg";
import SocialMediaButton from "../Common/Buttons/SocialMediaButton/SocialMediaButton";
import { useAuth } from "@/context/AuthContext";
import { showErrorToast } from "@/utils/toastUtils";

const Register = (props) => {
  const { signUp } = useAuth();
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, "Username must be at least 3 characters")
      .required("Username is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .required("Password is required")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least 8 characters, one uppercase letter, one number, and one special symbol"
      ),
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await signUp(values.email, values.password, { name: values.username });
        setRegisteredEmail(values.email);
        setEmailSent(true);
      } catch (error) {
        console.error("Registration failed:", error);
        showErrorToast(error.message || "Registration failed. Please try again.");
        formik.setSubmitting(false);
      }
    },
  });

  if (emailSent) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(255, 232, 26, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              stroke="#FFE81A"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p style={{ color: "#fff", fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>
          Check your email
        </p>
        <p style={{ color: "#B1B6C6", fontSize: "14px", lineHeight: "1.5" }}>
          We sent a confirmation link to
        </p>
        <p style={{ color: "#FFE81A", fontSize: "14px", marginBottom: "20px" }}>
          {registeredEmail}
        </p>
        <p style={{ color: "#B1B6C6", fontSize: "13px" }}>
          Click the link in the email to activate your account.
        </p>
      </div>
    );
  }

  return (
    <>
      <div>
        <form onSubmit={formik.handleSubmit}>
          <div className="form-group spacing-inputs">
            <label htmlFor="username" className="form-label">
              USERNAME <span className="required">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              value={formik.values.username}
              onChange={formik.handleChange}
              placeholder="Username"
            />
            {formik.errors.username && (
              <div className="error-message">{formik.errors.username}</div>
            )}
          </div>

          <div className="form-group spacing-inputs">
            <label htmlFor="email" className="form-label">
              EMAIL <span className="required">*</span>
            </label>
            <input
              type="text"
              id="email"
              name="email"
              className="form-input"
              value={formik.values.email}
              onChange={formik.handleChange}
              placeholder="youremail@domain.com"
            />
            {formik.errors.email && (
              <div className="error-message">{formik.errors.email}</div>
            )}
          </div>

          <div className="form-group spacing-inputs">
            <label htmlFor="password" className="form-label">
              PASSWORD <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formik.values.password}
              onChange={formik.handleChange}
              placeholder="********"
              autoComplete="new-password"
            />
            {formik.errors.password && (
              <div className="error-message">{formik.errors.password}</div>
            )}
          </div>

          <div className="info-text-container">
            <p className="info-text">
              This site is protected by reCAPTCHA and the Google Privacy Policy
              and Terms of Service apply.
            </p>
          </div>

          <button
            type="submit"
            className="register-button uppercase"
            disabled={formik.isSubmitting}
            style={{
              opacity: formik.isSubmitting ? 0.7 : 1,
              cursor: formik.isSubmitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {formik.isSubmitting ? (
              <>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgb(20, 23, 34)",
                    borderTop: "2px solid rgba(20, 23, 34, 0.2)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span>Creating account...</span>
              </>
            ) : (
              "Register"
            )}
          </button>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </form>
      </div>

      <span
        style={{
          fontSize: "15px",
          justifyContent: "center",
          color: "#B1B6C6",
          width: "100%",
          display: "flex",
        }}
      >
        Or continue with
      </span>
      <div className="social-media-container">
        <SocialMediaButton socialIcon={STEAM} socialName={"Steam"} />
        <SocialMediaButton socialIcon={TWITCH} socialName={"Twitch"} />
        <SocialMediaButton socialIcon={METAMASK} socialName={"Metamask"} />
      </div>
    </>
  );
};

export default Register;
