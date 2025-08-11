import { Audio } from 'expo-av';

let sound: Audio.Sound | null = null;

// Configure audio mode to ignore silent switch
const configureAudioMode = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true, // This makes sounds play in silent mode
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.error('Error configuring audio mode:', error);
  }
};

export const playCheckSound = async () => {
  try {
    // Configure audio mode first
    await configureAudioMode();
    
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