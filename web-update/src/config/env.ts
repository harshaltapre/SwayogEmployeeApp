export const env = {
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'swayog-dashboard',
  R2_ENDPOINT: process.env.R2_ENDPOINT || '',
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || process.env.PUBLIC_DISTRIBUTION_URL || '',
  WEB_DOMAIN: process.env.WEB_DOMAIN || 'https://swayog-dashboard.vercel.app',
};

export const ENV_ERROR = (() => {
  const errors: string[] = [];
  
  if (!env.R2_ACCOUNT_ID) errors.push('R2_ACCOUNT_ID');
  if (!env.R2_ACCESS_KEY_ID) errors.push('R2_ACCESS_KEY_ID');
  if (!env.R2_SECRET_ACCESS_KEY) errors.push('R2_SECRET_ACCESS_KEY');
  if (!env.R2_BUCKET_NAME) errors.push('R2_BUCKET_NAME');
  if (!env.R2_ENDPOINT) errors.push('R2_ENDPOINT');
  
  if (errors.length > 0) {
    return `Missing required environment variables: ${errors.join(', ')}`;
  }
  
  return null;
})();