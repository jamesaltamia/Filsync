import React from 'react';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

export const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div
            onClick={toggleTheme}
            className="relative w-14 h-7 flex items-center bg-white/10 border border-white/20 rounded-full p-1 cursor-pointer shadow-inner transition-colors duration-300 hover:bg-white/20"
        >
            {/* The moving "switch" circle */}
            <motion.div
                className="absolute w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center z-10"
                animate={{ x: theme === 'light' ? 0 : 28 }} // Slides back and forth
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
                {theme === 'light' ? (
                    <IconSun size={14} className="text-yellow-500" stroke={2.5} />
                ) : (
                    <IconMoon size={14} className="text-blue-900" stroke={2.5} />
                )}
            </motion.div>

            {/* Background Icons for decoration */}
            <div className="flex justify-between w-full px-1 opacity-50">
                <IconSun size={14} className="text-white" />
                <IconMoon size={14} className="text-white" />
            </div>
        </div>
    );
};