Business Pricing System – Full Specification (With Feature Comparison Table)
1. Overview
This document explains exactly how the Business Pricing System works, how it appears on the Pricing Page, and how the subscription level affects Rewards, Campaigns, Points, and Access Permissions inside the Business Dashboard.
We use 4 Subscription Levels:
Bronze
Silver
Gold
Platinum
And 2 Progress Levels within each Subscription Level:
Pro
Pro Plus
Example:
Bronze → Bronze Pro → Bronze Pro Plus → (automatically flows into Silver)
Progress Levels are not paid. They unlock automatically based on activity.
2. Key Logic for Levels
Subscription Level (Paid)
Controls:
How many Campaigns they can create
How many Rewards per Campaign
Whether they can edit admin-provided Rewards & Campaigns
Whether they can create Rewards from scratch
Monthly points allocation (threshold)
Maximum claimable customer actions
Number of Plaques, NFC items, etc.
Access to advanced marketing tools
Progress Level (Free Progression)
Controls:
Gradual unlocking of features inside that Subscription Level
Pro Plus equals "almost the next Subscription Level"
Gives them more points, more campaigns, more editing ability
Helps them try features of the next level
Encourages upgrade but does not force upgrade
Business can buy more points even without upgrading
3. Business Feature Comparison Table
Below is the complete capability matrix the developers will implement.
A. Subscription Features Table (Main)

B. Progress Level Table (Inside Each Subscription Level)
Each subscription level contains 3 internal stages:
4. Detailed Rules for Developers
Rule 1 – Subscription Level sets the main boundaries
Whatever is assigned at Bronze, Silver, Gold, Platinum is the main limit.
Rule 2 – Progress Level only expands a little within that boundary
Progress Levels do not break subscription boundaries, they only extend them slightly.
For example:
Bronze Pro Plus does not become fully Silver.
Instead, Bronze Pro Plus gets Silver-lite capabilities.
Rule 3 – Progress Level triggers
Progress increases based on:
Number of Campaigns created
Number of customer interactions
Total points used
Activity consistency
Completing platform setup steps
Rule 4 – Businesses can buy extra points anytime
Even if Bronze has 1,000 points monthly, they can purchase more without upgrading.
Rule 5 – Admin Templates
Low levels receive campaigns + rewards pushed by admin.
Permissions:
Bronze: Only view and use.
Bronze Pro: Edit admin templates.
Bronze Pro Plus: Create from scratch.
Silver+: Full creation ability from start.
5. How Features Reflect on Business Dashboard
The dashboard must change dynamically based on Subscription and Progress Level.
Dashboard Sections Impacted
Points Wallet
Shows points allocated, used, remaining
Shows "Buy More Points" button
Campaigns Area
Shows number created vs allowed
Shows locked notice when limit is reached
Shows "Upgrade for More" if subscription limit reached
Shows "Unlock more by progressing" if progress level limit reached
Rewards Area
Same structure as Campaigns
Locked if subscription doesn’t allow editing/creating
Templates Section
Bronze = only view
Bronze Pro = edit enabled
Bronze Pro Plus = Create button unlocked
Silver+ = Full unlocked
Subscription Status Panel
Shows: Bronze Pro (for example)
Shows progress bar to next stage
Shows what next stage will unlock
Shows upgrade button
Feature Locks  Locked features must clearly show:
Why it is locked
Whether upgrade or progress is required
What is needed to unlock
Example:
"To create a Reward from scratch, you need Bronze Pro Plus OR Silver subscription."
6. Pricing Page Structure (Business Side)
The Pricing Page must show:
All subscription levels
Features comparison table
What each package includes
Clear explanation of Progress Levels
Examples of Bronze → Bronze Pro → Bronze Pro Plus → Silver
Pricing Page Layout
Section 1 – Header
"Choose the plan that grows with your business."
Section 2 – Subscription Cards
Each card shows:
Name (Bronze/Silver/Gold/Platinum)
Monthly points
Campaign limits
Reward limits
Editing + creation abilities
Tools included
Price
CTA: Start / Upgrade
Section 3 – Progress Level Info
Explains:
All businesses start at Base
Activity unlocks Pro
More activity unlocks Pro Plus
Pro Plus gives preview of next subscription
Section 4 – Full Feature Table
The feature matrix created above.
7. Final Developer Notes
All feature visibility must be dynamic.
The dashboard should re-render when progress or subscription changes.
All locked features must show reason + unlock path.
The system must calculate progression automatically.
Admin can override subscription and progress.