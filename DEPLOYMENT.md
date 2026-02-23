# Deployment Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# WalletConnect Configuration
# Get your project ID from https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# Contract Addresses (Sepolia Testnet)
NEXT_PUBLIC_EPOCH_VAULT_ADDRESS=0x20b5f7EC98ac1ee823e516Fb0d5Cace6229D37aF
NEXT_PUBLIC_USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key_here
```

## GitHub Deployment

1. **Create a new repository** on GitHub
2. **Push your code**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/hearst-vault-frontend.git
   git push -u origin main
   ```

## Vercel Deployment

### Option 1: Deploy from GitHub

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**:
   - In Vercel dashboard, go to your project settings
   - Navigate to "Environment Variables"
   - Add all the environment variables from the `.env.local` file

3. **Deploy**:
   - Vercel will automatically deploy on every push to main branch

### Option 2: Deploy with Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login and Deploy**:
   ```bash
   vercel login
   vercel
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
   vercel env add NEXT_PUBLIC_EPOCH_VAULT_ADDRESS
   vercel env add NEXT_PUBLIC_USDC_ADDRESS
   vercel env add NEXT_PUBLIC_CHAIN_ID
   vercel env add NEXT_PUBLIC_RPC_URL
   ```

## Build and Test Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Production Checklist

- [ ] Environment variables configured
- [ ] WalletConnect Project ID set
- [ ] Contract addresses verified
- [ ] RPC URL configured
- [ ] Build passes without errors
- [ ] All features tested
- [ ] Security headers configured
- [ ] Performance optimized

## Troubleshooting

### Common Issues

1. **Build Errors**: Check that all dependencies are installed
2. **Environment Variables**: Ensure all required variables are set
3. **WalletConnect**: Verify project ID is correct
4. **Contract Addresses**: Confirm addresses are valid for the network

### Support

For issues related to:
- **WalletConnect**: Check [WalletConnect Documentation](https://docs.walletconnect.com/)
- **Wagmi**: Check [Wagmi Documentation](https://wagmi.sh/)
- **Next.js**: Check [Next.js Documentation](https://nextjs.org/docs)
- **Vercel**: Check [Vercel Documentation](https://vercel.com/docs)
