/**
 * Login Screen
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  useTheme,
  ActivityIndicator,
  HelperText,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { login, clearError } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store/store';
import { validateEmail, validatePassword } from '../../utils/validation';

type LoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Login'
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [touched, setTouched] = useState({ email: false, password: false });

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (touched.email) {
      const validation = validateEmail(text);
      setEmailError(validation.error);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (touched.password) {
      const validation = validatePassword(text);
      setPasswordError(validation.error);
    }
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched({ ...touched, [field]: true });
    if (field === 'email') {
      const validation = validateEmail(email);
      setEmailError(validation.error);
    } else if (field === 'password') {
      const validation = validatePassword(password);
      setPasswordError(validation.error);
    }
  };

  const handleLogin = async () => {
    // Validate all fields
    setTouched({ email: true, password: true });
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    setEmailError(emailValidation.error);
    setPasswordError(passwordValidation.error);

    if (!emailValidation.isValid || !passwordValidation.isValid) {
      return;
    }

    dispatch(clearError());
    const result = await dispatch(login({ email, password }));
    
    if (login.fulfilled.match(result)) {
      // Navigation will happen automatically via AppNavigator
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={styles.surface}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/newlog.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text variant="headlineMedium" style={styles.title}>
            Clean Motion Ghana
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign in to your account
          </Text>

          {error && (
            <Surface style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </Surface>
          )}

          <TextInput
            label="Email"
            value={email}
            onChangeText={handleEmailChange}
            onBlur={() => handleBlur('email')}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
            disabled={isLoading}
            error={!!emailError}
            accessible={true}
            accessibilityLabel="Email input"
          />
          <HelperText type="error" visible={!!emailError}>
            {emailError}
          </HelperText>

          <TextInput
            label="Password"
            value={password}
            onChangeText={handlePasswordChange}
            onBlur={() => handleBlur('password')}
            mode="outlined"
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
                accessible={true}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              />
            }
            style={styles.input}
            disabled={isLoading}
            error={!!passwordError}
            autoComplete="password"
            accessible={true}
            accessibilityLabel="Password input"
          />
          <HelperText type="error" visible={!!passwordError}>
            {passwordError}
          </HelperText>

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            disabled={isLoading || !email || !password || !!emailError || !!passwordError}
            loading={isLoading}
            accessible={true}
            accessibilityLabel="Sign in button"
            accessibilityRole="button"
          >
            Sign In
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            style={styles.linkButton}
            disabled={isLoading}
            accessible={true}
            accessibilityLabel="Navigate to registration"
            accessibilityRole="button"
          >
            Don't have an account? Sign Up
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  surface: {
    padding: 24,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0A3D62',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#64748b',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
  linkButton: {
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 60,
  },
});
