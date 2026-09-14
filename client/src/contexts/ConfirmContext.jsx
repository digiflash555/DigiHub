import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext();

export const useConfirm = () => {
    return useContext(ConfirmContext);
};

export const ConfirmProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        message: '',
        resolve: null,
    });

    const confirm = useCallback((message) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                message,
                resolve,
            });
        });
    }, []);

    const handleConfirm = () => {
        if (confirmState.resolve) {
            confirmState.resolve(true);
        }
        setConfirmState({ ...confirmState, isOpen: false });
    };

    const handleCancel = () => {
        if (confirmState.resolve) {
            confirmState.resolve(false);
        }
        setConfirmState({ ...confirmState, isOpen: false });
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AnimatePresence>
                {confirmState.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={handleCancel}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-sm bg-white dark:bg-[#20242B] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                        >
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Confirm Action</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                        {confirmState.message}
                                    </p>
                                </div>
                                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                                    <button
                                        onClick={handleCancel}
                                        className="w-full px-5 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        className="w-full px-5 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/30"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ConfirmContext.Provider>
    );
};
