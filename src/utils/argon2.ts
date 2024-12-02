import argon2 from "argon2";


export const hashPassword = async (password: string): Promise<string> => {
    try {
        return await argon2.hash(password);
    } catch (error) {
        console.error("Error while hashing password:", error);
        throw new Error("Password hashing failed");
    }
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    try {
        return await argon2.verify(hash, password);
    } catch (error) {
        console.error("Error while verifying password:", error);
        return false;
    }
};
