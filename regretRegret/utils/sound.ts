import { Audio } from 'expo-av';

let sound: Audio.Sound | null = null;

export const playCheckSound = async () => {
  try {
    if (sound) {
      await sound.unloadAsync();
    }
    
    const { sound: newSound } = await Audio.Sound.createAsync(
      require('../assets/regretRibbet_1.m4a'),
      { shouldPlay: true }
    );
    
    sound = newSound;
    
    // Unload the sound after it finishes playing
    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (!status.isLoaded) return;
      
      if (status.isPlaying === false && status.positionMillis === status.durationMillis) {
        await sound?.unloadAsync();
        sound = null;
      }
    });
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}; 