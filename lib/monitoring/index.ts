export function captureError(error: Error, context?: Record<string, any>) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error, context);
    return;
  }
  
  // In production, send to monitoring service
  // TODO: Integrate with Sentry or similar
  console.error(JSON.stringify({
    error: {
      message: error.message,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  }));
}

export function captureWarning(message: string, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Warning:', message, context);
    return;
  }
  
  console.warn(JSON.stringify({
    level: 'warning',
    message,
    context,
    timestamp: new Date().toISOString(),
  }));
}

export function captureInfo(message: string, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.info('Info:', message, context);
    return;
  }
  
  console.info(JSON.stringify({
    level: 'info',
    message,
    context,
    timestamp: new Date().toISOString(),
  }));
}