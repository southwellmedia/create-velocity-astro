/**
 * Validates a project name for npm package naming conventions
 */
export function validateProjectName(name: string): { valid: boolean; message?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, message: 'Project name cannot be empty' };
  }

  // Must be lowercase
  if (name !== name.toLowerCase()) {
    return { valid: false, message: 'Project name must be lowercase' };
  }

  // Cannot start with . or _
  if (name.startsWith('.') || name.startsWith('_')) {
    return { valid: false, message: 'Project name cannot start with . or _' };
  }

  // Cannot contain spaces
  if (/\s/.test(name)) {
    return { valid: false, message: 'Project name cannot contain spaces' };
  }

  // Cannot contain special characters except - and @/
  if (!/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)) {
    return {
      valid: false,
      message: 'Project name can only contain lowercase letters, numbers, hyphens, and underscores',
    };
  }

  // Length check
  if (name.length > 214) {
    return { valid: false, message: 'Project name must be 214 characters or fewer' };
  }

  return { valid: true };
}

/**
 * Sanitizes a string to be a valid project name
 */
export function toValidProjectName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_~.]/g, '-')
    .replace(/^[-._]+/, '')
    .replace(/[-._]+$/, '')
    .replace(/-+/g, '-');
}
