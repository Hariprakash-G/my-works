import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface LoaderProps {
    size?: 'small' | 'large';
    color?: string;
}

const KeycloakLoader: React.FC<LoaderProps> = ({ 
    size = 'large', 
    color = '#0000ff' 
}) => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size={size} color={color} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
});

export default KeycloakLoader;