import { useState, useEffect, useCallback } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { AuthContext } from './createAuthContext';

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch profile for authenticated user
    const fetchUserProfile = useCallback(async (uid) => {
        if (!uid) {
            setUserProfile(null);
            return null;
        }

        try {
            const memberDocRef = doc(db, 'members', uid);
            const docSnap = await getDoc(memberDocRef);

            if (docSnap.exists()) {
                const profileData = docSnap.data();
                setUserProfile(profileData);
                return profileData;
            } else {
                setUserProfile(null);
                return null;
            }
        } catch (error) {
            console.error('Error fetching member profile:', error);
            setUserProfile(null);
            return null;
        }
    }, []);

    // Auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                await fetchUserProfile(user.uid);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [fetchUserProfile]);

    // Register user & create initial Firestore member document
    const register = async (email, password, extraData = {}) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const initialProfile = {
            uid: user.uid,
            name: extraData.name ? extraData.name.trim() : '',
            email: user.email,
            phone: extraData.phone ? extraData.phone.trim() : '',
            college: extraData.college || 'DYPIU',
            branch: extraData.branch || 'CSE',
            year: extraData.year || '1st',
            bio: extraData.bio ? extraData.bio.trim() : '',
            avatarUrl: extraData.avatarUrl || '',
            joinedAt: serverTimestamp(), // IMMUTABLE - set ONCE on registration
            profileComplete: true,
            eventsAttended: [],
            certificatesEarned: [],
            memberType: extraData.memberType === 'ecell_member' ? 'ecell_member' : 'normal_member',
            onboardingComplete: false,
            lastUpdated: serverTimestamp()
        };

        const memberDocRef = doc(db, 'members', user.uid);
        await setDoc(memberDocRef, initialProfile);

        // Fetch fresh profile state
        await fetchUserProfile(user.uid);
        return user;
    };

    // Login user
    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const profile = await fetchUserProfile(userCredential.user.uid);
        return { user: userCredential.user, profile };
    };

    // Logout user
    const logout = async () => {
        await signOut(auth);
        setCurrentUser(null);
        setUserProfile(null);
    };

    // Password reset email
    const sendResetPassword = async (email) => {
        await sendPasswordResetEmail(auth, email);
    };

    // Refresh member profile manually
    const refreshProfile = async () => {
        if (currentUser) {
            return await fetchUserProfile(currentUser.uid);
        }
        return null;
    };

    // Update profile fields (never touches joinedAt, uid, or email)
    const updateProfileData = async (updatedFields) => {
        if (!currentUser) throw new Error('No authenticated user');

        // Security check: strip immutable fields if accidentally passed
        const safeData = { ...updatedFields };
        delete safeData.joinedAt;
        delete safeData.uid;
        delete safeData.email;

        safeData.lastUpdated = serverTimestamp();

        const memberDocRef = doc(db, 'members', currentUser.uid);
        await updateDoc(memberDocRef, safeData);
        await fetchUserProfile(currentUser.uid);
    };

    const value = {
        currentUser,
        userProfile,
        loading,
        register,
        login,
        logout,
        sendResetPassword,
        refreshProfile,
        updateProfileData
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
