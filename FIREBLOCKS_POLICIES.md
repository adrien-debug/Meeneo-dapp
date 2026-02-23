# 🔥 Fireblocks Transaction Policies Configuration for Hearst dApp

## 1. Policy Types You Need to Configure

### A. WalletConnect dApp Policy
**Purpose:** Allow transactions from your dApp via WalletConnect

**Configuration:**
- **Policy Name:** "Hearst dApp WalletConnect"
- **Transaction Type:** "CONTRACT_INTERACTION"
- **Source:** Your vault account(s)
- **Destination:** Smart contract addresses (EpochVault, USDC)
- **Asset Type:** "FUNGIBLE" (USDC)
- **Approval Workflow:** Set based on your security requirements

### B. Contract Interaction Policy
**Purpose:** Allow interactions with your smart contracts

**Configuration:**
- **Policy Name:** "Hearst Contract Interactions"
- **Transaction Type:** "CONTRACT_INTERACTION"
- **Allowed Contracts:**
  - EpochVault: `0xd399F6D01dFdADE2Cf66ccB24d84f7081373CbCC`
  - USDC: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **Asset Type:** "FUNGIBLE"
- **Amount Limits:** Set appropriate limits for deposits/withdrawals

### C. Token Approval Policy
**Purpose:** Allow USDC approvals for contract interactions

**Configuration:**
- **Policy Name:** "Hearst USDC Approvals"
- **Transaction Type:** "CONTRACT_INTERACTION"
- **Function:** "approve"
- **Asset:** USDC
- **Approval Limits:** Set maximum approval amounts

## 2. Step-by-Step Configuration

### Step 1: Create WalletConnect Policy
1. **Navigate to:** Settings → Transaction Authorization Policy
2. **Click:** "Create New Policy"
3. **Fill in:**
   ```
   Policy Name: Hearst WalletConnect dApp
   Description: Allow transactions from Hearst dApp via WalletConnect
   
   Initiator: [Your user/role]
   Source: [Your vault account]
   Transaction Type: CONTRACT_INTERACTION
   Asset Type: FUNGIBLE
   
   Destination Rules:
   - Type: EXTERNAL_WALLET
   - Address: 0xd399F6D01dFdADE2Cf66ccB24d84f7081373CbCC (EpochVault)
   - Address: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (USDC)
   
   Amount Limits:
   - Per Transaction: [Set your limit, e.g., $100,000]
   - Daily Limit: [Set your limit, e.g., $500,000]
   
   Approval Workflow:
   - Required Approvals: [Set based on your security needs]
   - Approvers: [Assign specific users/roles]
   ```

### Step 2: Create Contract Interaction Policy
1. **Create another policy:**
   ```
   Policy Name: Hearst Contract Functions
   Description: Allow specific contract function calls
   
   Transaction Type: CONTRACT_INTERACTION
   Asset Type: FUNGIBLE
   
   Contract Addresses:
   - 0xd399F6D01dFdADE2Cf66ccB24d84f7081373CbCC (EpochVault)
   
   Allowed Functions:
   - deposit
   - withdraw
   - claimRewards
   - redeposit
   - adminWithdraw
   - distributeRewards
   - adminDeposit
   
   Amount Limits:
   - Per Transaction: [Set appropriate limits]
   - Daily Limit: [Set appropriate limits]
   ```

### Step 3: Create Token Approval Policy
1. **Create approval policy:**
   ```
   Policy Name: Hearst USDC Approvals
   Description: Allow USDC approvals for contract interactions
   
   Transaction Type: CONTRACT_INTERACTION
   Asset Type: FUNGIBLE
   
   Contract Address: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (USDC)
   Function: approve
   
   Approval Limits:
   - Max Approval Amount: [Set limit, e.g., $1,000,000]
   - Approval Duration: [Set time limit for approvals]
   ```

## 3. Specific Configuration for Your Functions

### A. Deposit Function
```
Function: deposit
Contract: 0xd399F6D01dFdADE2Cf66ccB24d84f7081373CbCC
Parameters: amount (uint256)
Amount Limits: [Set based on your requirements]
```

### B. Withdraw Function
```
Function: withdraw
Contract: 0xd399F6D01dFdADE2Cf66ccB24d84f7081373CbCC
Parameters: amount (uint256)
Amount Limits: [Set based on your requirements]
```

### C. Admin Withdraw Function
```
Function: adminWithdraw
Contract: 0xd399F6D01dFdADE2Cf66ccB24d84f7081373CbCC
Parameters: amount (uint256)
Special Requirements: 
- Higher approval requirements
- Additional security checks
- Audit trail requirements
```

### D. Reward Distribution
```
Function: distributeRewards
Contract: 0xd399F6D01dFdADE2Cf66ccB24d84f7081373CbCC
Parameters: amount (uint256)
Special Requirements:
- Admin-only access
- Multi-signature approval
```

## 4. Time-Based Thresholds

### Example: Daily Transaction Limits
```json
{
  "amountAggregation": {
    "operators": "ACROSS_ALL_MATCHES",
    "dstTransferPeers": "ACROSS_ALL_MATCHES",
    "srcTransferPeers": "ACROSS_ALL_MATCHES"
  },
  "amountScope": "TIMEFRAME",
  "periodSec": 86400
}
```

## 5. Approval Workflow Configuration

### A. Standard Transactions (Deposit/Withdraw)
- **Required Approvals:** 1-2 approvers
- **Approval Timeout:** 24 hours
- **Approvers:** Designated users with appropriate permissions

### B. Admin Transactions (Admin Withdraw/Reward Distribution)
- **Required Approvals:** 2-3 approvers
- **Approval Timeout:** 48 hours
- **Approvers:** Senior administrators only
- **Additional Requirements:** Audit trail, notification system

## 6. Security Considerations

### A. Whitelist Management
- **Contract Addresses:** Only allow interactions with verified contracts
- **Function Signatures:** Restrict to specific function calls
- **Parameter Validation:** Set limits on function parameters

### B. Risk Management
- **Amount Limits:** Set appropriate transaction limits
- **Time Limits:** Implement cooldown periods
- **Approval Requirements:** Require multiple approvals for large amounts

### C. Monitoring and Alerts
- **Transaction Monitoring:** Set up alerts for unusual activity
- **Approval Tracking:** Monitor approval workflows
- **Audit Logs:** Maintain comprehensive transaction logs

## 7. Testing Your Policies

### A. Test Scenarios
1. **Small Deposit:** Test with small amount (e.g., $100)
2. **Large Deposit:** Test with larger amount (e.g., $10,000)
3. **Withdrawal:** Test withdrawal functionality
4. **Admin Functions:** Test admin-specific functions
5. **Approval Flow:** Test the approval workflow

### B. Validation Checklist
- [ ] Policies are active and enforced
- [ ] Transaction limits are appropriate
- [ ] Approval workflows are functioning
- [ ] Contract addresses are whitelisted
- [ ] Function signatures are allowed
- [ ] Amount limits are set correctly
- [ ] Time-based thresholds are configured
- [ ] Monitoring and alerts are set up

## 8. Troubleshooting Common Issues

### A. "Transaction Blocked"
- Check if contract address is whitelisted
- Verify function signature is allowed
- Confirm amount is within limits
- Check approval requirements

### B. "Approval Required"
- Verify approval workflow is configured
- Check if approvers are assigned
- Confirm approval timeout settings
- Validate approver permissions

### C. "Policy Not Applied"
- Ensure policy is active
- Check policy priority/order
- Verify policy conditions match transaction
- Confirm policy scope is correct

## 9. Best Practices

1. **Start Conservative:** Begin with strict policies and relax as needed
2. **Regular Reviews:** Review and update policies regularly
3. **Documentation:** Maintain clear documentation of all policies
4. **Testing:** Test policies thoroughly before production use
5. **Monitoring:** Implement comprehensive monitoring and alerting
6. **Backup Plans:** Have fallback procedures for policy issues
