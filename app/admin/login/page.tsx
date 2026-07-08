"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './login.module.css';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        {/* Left Panel */}
        <div className={styles.leftPanel}>
          <div className={styles.backIcon} title="Go back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </div>

          <h1 className={styles.title}>Login to system</h1>
          <p className={styles.subtitle}>
            Please enter your login information<br />
            or <a href="#" className={styles.link}>click here</a> to registration
          </p>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className={`${styles.formGroup} ${styles.usernameGroup}`}>
              <input
                type="text"
                className={styles.input}
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <input
                type="password"
                className={styles.input}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <label className={styles.rememberMe}>
              <input type="checkbox" className={styles.checkbox} />
              Remember me
            </label>

            <button type="submit" className={styles.loginBtn}>
              Log In
            </button>
          </form>
        </div>

        {/* Right Panel */}
        <div className={styles.rightPanel}>
          {/* Abstract Wave Background */}
          <div className={styles.waveContainer}>
            <div className={`${styles.waveBlob} ${styles.blob1}`}></div>
            <div className={`${styles.waveBlob} ${styles.blob2}`}></div>
            <div className={`${styles.waveBlob} ${styles.blob3}`}></div>
            <div className={`${styles.waveBlob} ${styles.blob4}`}></div>
          </div>
          <div className={styles.waveOverlay}></div>

          {/* Logo overlay */}
          <div className={styles.logoContainer}>
            <div className={styles.logoContent}>
              <div className={styles.logoWrapper}>
                <Image 
                  src="/logo-cloudmood.png" 
                  alt="Cloudmood Logo" 
                  width={140} 
                  height={140} 
                  className={styles.logoImage}
                  priority
                />
              </div>
              <h2 className={styles.brandTitle}>CloudMood</h2>
              <p className={styles.brandSubtitle}>Travel Management Platform</p>
              <div className={styles.brandBadge}>
                🌤️ Weather-Based Travel Insights
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
