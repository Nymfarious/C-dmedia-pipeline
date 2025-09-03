// Environment variable validation for server startup

export interface ServerEnvConfig {
  NODE_ENV: string;
  PORT: string;
  REPLICATE_API_TOKEN?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  ALLOWED_ORIGINS?: string;
}

export const validateEnvironment = (): ServerEnvConfig => {
  const config: ServerEnvConfig = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '3001',
    REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
  };

  // Validate required variables for production
  if (config.NODE_ENV === 'production') {
    const required = ['REPLICATE_API_TOKEN', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
    }

    if (!config.ALLOWED_ORIGINS) {
      console.warn('⚠️  ALLOWED_ORIGINS not set in production - using default domain');
    }
  }

  // Validate development setup
  if (config.NODE_ENV === 'development') {
    const warnings = [];
    
    if (!config.REPLICATE_API_TOKEN) {
      warnings.push('REPLICATE_API_TOKEN not set - using stub responses');
    }
    
    if (!config.SUPABASE_SERVICE_ROLE_KEY) {
      warnings.push('SUPABASE_SERVICE_ROLE_KEY not set - authentication will fail');
    }

    if (warnings.length > 0) {
      console.warn('⚠️  Development warnings:');
      warnings.forEach(warning => console.warn(`   - ${warning}`));
    }
  }

  return config;
};

export const logServerConfig = (config: ServerEnvConfig) => {
  console.log('🔧 Server Configuration:');
  console.log(`   - Environment: ${config.NODE_ENV}`);
  console.log(`   - Port: ${config.PORT}`);
  console.log(`   - Replicate API: ${config.REPLICATE_API_TOKEN ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   - Supabase URL: ${config.SUPABASE_URL ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   - Supabase Service Key: ${config.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '❌ Missing'}`);
  
  if (config.NODE_ENV === 'production') {
    console.log(`   - Allowed Origins: ${config.ALLOWED_ORIGINS || 'Using defaults'}`);
  }
};