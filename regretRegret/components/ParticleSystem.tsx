import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Particle from './Particle';

interface ParticleSystemProps {
  count?: number;
  color?: string;
}

const ParticleSystem = ({ count = 8, color }: ParticleSystemProps) => {
  const [particles] = useState(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      color,
    }))
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map(particle => (
        <Particle
          key={particle.id}
          color={particle.color}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible',
  },
});

export default ParticleSystem; 