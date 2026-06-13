import { EnvironmentVariable } from '@/types';

const isDesktop = typeof window !== 'undefined' && !!window.electronAPI;

/** Check whether the OS-level encryption is available */
export const isVaultAvailable = async (): Promise<boolean> => {
    if (!isDesktop) return false;
    try {
        const res = await window.electronAPI.invoke('vault:isAvailable');
        return !!res?.available;
    } catch {
        return false;
    }
};

/**
 * Encrypt a plaintext value using Electron safeStorage (OS keychain).
 * Returns the Base64-encoded cipher blob, or null if unavailable.
 */
export const encryptVaultValue = async (plaintext: string): Promise<string | null> => {
    if (!isDesktop) return null;
    try {
        const res = await window.electronAPI.invoke('vault:encrypt', { value: plaintext });
        if (res?.success) return res.encryptedValue as string;
        console.error('[VAULT] Encryption failed:', res?.error);
        return null;
    } catch (err) {
        console.error('[VAULT] Encryption error:', err);
        return null;
    }
};

/**
 * Decrypt a Base64 cipher blob back to plaintext.
 * Returns null if decryption fails or is unavailable.
 */
export const decryptVaultValue = async (encryptedValue: string): Promise<string | null> => {
    if (!isDesktop) return null;
    try {
        const res = await window.electronAPI.invoke('vault:decrypt', { encryptedValue });
        if (res?.success) return res.value as string;
        console.error('[VAULT] Decryption failed:', res?.error);
        return null;
    } catch (err) {
        console.error('[VAULT] Decryption error:', err);
        return null;
    }
};

/**
 * Resolve the effective plaintext value of an environment variable.
 * For vault variables, decrypts on-demand. For regular variables, returns value directly.
 * Used at request-send time for transparent `{{variable}}` substitution.
 */
export const resolveVariableValue = async (variable: EnvironmentVariable): Promise<string> => {
    if (variable.isSecret && variable.encryptedValue) {
        const decrypted = await decryptVaultValue(variable.encryptedValue);
        return decrypted ?? '';
    }
    return variable.value || '';
};

/**
 * Resolve all variables in an environment to their plaintext values.
 * Returns a key→value map suitable for `{{variable}}` substitution.
 */
export const resolveAllVariables = async (
    variables: EnvironmentVariable[]
): Promise<Record<string, string>> => {
    const result: Record<string, string> = {};
    await Promise.all(
        variables
            .filter(v => v.enabled && v.key)
            .map(async v => {
                result[v.key] = await resolveVariableValue(v);
            })
    );
    return result;
};
