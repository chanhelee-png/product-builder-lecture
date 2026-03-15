# Blueprint: Parent-Child Pocket Money & Coin Manager

## Overview
A collaborative web application designed to help parents and children manage both pocket money and a reward-based "Coin" system. It fosters financial literacy and rewards positive behavior.

## Features
- **Dual Currency System:** Track both traditional Pocket Money (₩) and Reward Coins (🪙).
- **Role-Based Views:** Toggle between Parent and Child interfaces.
- **Parent Management:** 
    - Give Pocket Money or Reward Coins.
    - Approval system for allowances.
- **Child Spending Tracker:**
    - Record spending in Money or Coins.
- **Unified Dashboard:**
    - Real-time display of both balances (Money & Coins).
    - Merged transaction history with clear visual distinction.
- **Modern UI:** Vibrant, interactive design using Web Components and modern CSS.

## Current Plan (Transformation Steps)
1. **Multi-Currency Infrastructure:** Update `State` to manage two balances and tag history items by currency type.
2. **Dual Balance Display:** Modify `<balance-display>` to show both Money and Coin balances with distinct icons/glows.
3. **Flexible Input Forms:** Update forms to allow toggling between Money and Coin for both giving and spending.
4. **Enhanced History:** Update `<transaction-history>` to visually differentiate between currency types.
5. **Persistence:** Ensure both currencies are correctly saved to `localStorage`.

## Tech Stack
- **HTML5 / CSS3:** Baseline features, Web Components.
- **JavaScript:** ES Modules, LocalStorage.
