import { Alert } from 'react-native';
import axios, { type AxiosError } from 'axios';

interface DjangoError {
  [key: string]: string[];
}

export const handleApiError = (error: unknown, fallbackMessage = 'An unexpected error occurred', showAlert = true): Error => {
  if (!error) {
    if (showAlert) Alert.alert('Error', fallbackMessage);
    return new Error(fallbackMessage);
  }

  // Handle Axios errors
  if (isAxiosError(error)) {
    const message = extractErrorMessage(error);
    if (showAlert) Alert.alert('Error', message);
    return new Error(message);
  }

  // Handle other errors
  if (error instanceof Error) {
    if (showAlert) Alert.alert('Error', error.message);
    return error;
  }

  // Handle unknown errors
  if (showAlert) Alert.alert('Error', fallbackMessage);
  return new Error(fallbackMessage);
};

const isAxiosError = (error: unknown): error is AxiosError => {
  return axios.isAxiosError(error);
};

const extractErrorMessage = (error: AxiosError): string => {
  const data = error.response?.data;
  
  // If data is a string, return it directly
  if (typeof data === 'string') {
    return data;
  }

  // Handle Django REST Framework error format
  if (data && typeof data === 'object') {
    // Handle non-field errors
    if ('non_field_errors' in data) {
      const nonFieldErrors = data['non_field_errors'];
      if (Array.isArray(nonFieldErrors) && nonFieldErrors.length > 0) {
        return nonFieldErrors.join(' ');
      }
    }

    // Handle field-specific errors
    if (isErrorObject(data)) {
      const messages: string[] = [];
      Object.entries(data).forEach(([field, errors]) => {
        if (Array.isArray(errors) && errors.length > 0) {
          messages.push(`${field}: ${errors.join(' ')}`);
        }
      });
      if (messages.length > 0) {
        return messages.join('\n');
      }
    }

    // Handle detail field
    if ('detail' in data && typeof data.detail === 'string') {
      return data.detail;
    }
  }

  // Fallback to status text or generic message
  return error.response?.statusText || 'An error occurred while processing your request';
};

const isErrorObject = (obj: unknown): obj is DjangoError => {
  return typeof obj === 'object' && obj !== null && Object.values(obj).every(Array.isArray);
}; 