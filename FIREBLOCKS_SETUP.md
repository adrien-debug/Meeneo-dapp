# 🔥 Fireblocks WalletConnect Configuration Guide

## 1. Fireblocks Dashboard Setup

### A. API Credentials
1. **Login to Fireblocks Console:** https://console.fireblocks.io
2. **Navigate to:** Settings → API Management
3. **Create API Key:**
   - Click "Create API Key"
   - Name: "Hearst Frontend"
   - Permissions: Enable "WalletConnect" and "Transaction Signing"
   - Download the secret key (keep secure!)

### B. WalletConnect Configuration
1. **Go to:** Settings → Integrations → WalletConnect
2. **Enable WalletConnect:**
   - Toggle "Enable WalletConnect" to ON
   - Set "Allowed Origins": Add your domain (e.g., `https://yourdomain.com`)
   - Configure "Transaction Policies"

### C. dApp Whitelisting
1. **Navigate to:** Settings → Policy → Transaction Policies
2. **Create Policy for WalletConnect:**
   - Name: "Hearst dApp Policy"
   - Source Type: "WalletConnect"
   - Allowed Operations: "Contract Interaction", "Transfer"
   - Set transaction limits as needed

## 2. Frontend Configuration Updates

### A. Environment Variables
Create `.env.local` file:
```bash
# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id

# Your actual domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Fireblocks-specific (if using direct integration)
NEXT_PUBLIC_FIREBLOCKS_API_KEY=your_api_key
NEXT_PUBLIC_FIREBLOCKS_VAULT_ACCOUNT_ID=your_vault_id
```

### B. Update Metadata
Update `src/context/index.tsx`:
```typescript
const metadata = {
  name: 'Hearst',
  description: 'Decentralized vault with epoch-based rewards',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com',
  icons: [`${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/icon.png`]
}
```

## 3. Fireblocks-Specific Transaction Handling

### A. Enhanced Error Handling
The current implementation already includes Fireblocks-specific error handling, but you can enhance it further.

### B. Transaction Approval Flow
1. **User clicks transaction button**
2. **WalletConnect shows connection modal**
3. **User scans QR code with Fireblocks mobile app**
4. **Transaction appears in Fireblocks dashboard**
5. **Admin approves transaction in Fireblocks**
6. **Transaction is broadcasted to blockchain**

## 4. Troubleshooting Common Issues

### A. "Transaction not broadcasted"
- ✅ Check Fireblocks dashboard for pending transactions
- ✅ Ensure transaction policies allow the operation
- ✅ Verify the dApp is whitelisted
- ✅ Check API key permissions

### B. "Connection failed"
- ✅ Verify WalletConnect Project ID is correct
- ✅ Check domain is whitelisted in Fireblocks
- ✅ Ensure metadata URL matches your domain

### C. "Transaction timeout"
- ✅ Increase timeout in your code (currently 30 seconds)
- ✅ Check Fireblocks approval workflow
- ✅ Verify gas settings

## 5. Testing Checklist

- [ ] WalletConnect Project ID configured
- [ ] Domain whitelisted in Fireblocks
- [ ] Transaction policies configured
- [ ] API permissions set correctly
- [ ] Metadata URL matches domain
- [ ] Test transaction flow end-to-end

## 6. Alternative: Direct Fireblocks Integration

If WalletConnect continues to have issues, consider using Fireblocks Web3 Provider directly:

```bash
npm install @fireblocks/fireblocks-web3-provider
```

This would require a more significant refactor but provides better control over the transaction flow.
