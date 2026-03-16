/**
 * Register Screen
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
  HelperText,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { register, clearError } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store/store';
import {
  validateEmail,
  validatePassword,
  validateRequired,
  validatePasswordConfirmation,
  getPasswordStrength,
} from '../../utils/validation';

type RegisterScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Register'
>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: Props) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [passwordStrength, setPasswordStrength] = useState<ReturnType<typeof getPasswordStrength> | null>(null);

  const validateField = (field: string, value: string) => {
    let validation: { isValid: boolean; error?: string } = { isValid: true };

    switch (field) {
      case 'firstName':
        validation = validateRequired(value, 'First name');
        break;
      case 'lastName':
        validation = validateRequired(value, 'Last name');
        break;
      case 'email':
        validation = validateEmail(value);
        break;
      case 'password':
        validation = validatePassword(value);
        if (validation.isValid) {
          setPasswordStrength(getPasswordStrength(value));
        } else {
          setPasswordStrength(null);
        }
        break;
      case 'confirmPassword':
        validation = validatePasswordConfirmation(password, value);
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: validation.error }));
    return validation.isValid;
  };

  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case 'firstName':
        setFirstName(value);
        break;
      case 'lastName':
        setLastName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'phone':
        setPhone(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
    }

    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === 'firstName' ? firstName :
                  field === 'lastName' ? lastName :
                  field === 'email' ? email :
                  field === 'phone' ? phone :
                  field === 'password' ? password :
                  confirmPassword;
    validateField(field, value);
  };

  const handleRegister = async () => {
    // Mark all fields as touched
    const allFields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
    allFields.forEach((field) => setTouched((prev) => ({ ...prev, [field]: true })));

    // Validate all fields
    const validations = {
      firstName: validateRequired(firstName, 'First name'),
      lastName: validateRequired(lastName, 'Last name'),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validatePasswordConfirmation(password, confirmPassword),
    };

    setErrors({
      firstName: validations.firstName.error,
      lastName: validations.lastName.error,
      email: validations.email.error,
      password: validations.password.error,
      confirmPassword: validations.confirmPassword.error,
    });

    const allValid = Object.values(validations).every((v) => v.isValid);
    if (!allValid) {
      return;
    }

    dispatch(clearError());
    await dispatch(
      register({
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
      })
    );
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
            Create Account
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Join Clean Motion Ghana
          </Text>

          {error && (
            <Surface style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </Surface>
          )}

          <TextInput
            label="First Name"
            value={firstName}
            onChangeText={(value) => handleFieldChange('firstName', value)}
            onBlur={() => handleBlur('firstName')}
            mode="outlined"
            style={styles.input}
            disabled={isLoading}
            error={!!errors.firstName}
            autoComplete="given-name"
            accessible={true}
            accessibilityLabel="First name input"
          />
          <HelperText type="error" visible={!!errors.firstName}>
            {errors.firstName}
          </HelperText>

          <TextInput
            label="Last Name"
            value={lastName}
            onChangeText={(value) => handleFieldChange('lastName', value)}
            onBlur={() => handleBlur('lastName')}
            mode="outlined"
            style={styles.input}
            disabled={isLoading}
            error={!!errors.lastName}
            autoComplete="family-name"
            accessible={true}
            accessibilityLabel="Last name input"
          />
          <HelperText type="error" visible={!!errors.lastName}>
            {errors.lastName}
          </HelperText>

          <TextInput
            label="Email"
            value={email}
            onChangeText={(value) => handleFieldChange('email', value)}
            onBlur={() => handleBlur('email')}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
            disabled={isLoading}
            error={!!errors.email}
            accessible={true}
            accessibilityLabel="Email input"
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>

          <TextInput
            label="Phone (Optional)"
            value={phone}
            onChangeText={(value) => handleFieldChange('phone', value)}
            mode="outlined"
            keyboardType="phone-pad"
            autoComplete="tel"
            style={styles.input}
            disabled={isLoading}
            accessible={true}
            accessibilityLabel="Phone number input"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={(value) => handleFieldChange('password', value)}
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
            error={!!errors.password}
            autoComplete="password-new"
            accessible={true}
            accessibilityLabel="Password input"
          />
          <HelperText type="error" visible={!!errors.password}>
            {errors.password || (passwordStrength && `Password strength: ${passwordStrength.strength}`)}
          </HelperText>
          {passwordStrength && passwordStrength.feedback.length > 0 && (
            <HelperText type="info" visible={true}>
              {passwordStrength.feedback[0]}
            </HelperText>
          )}

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(value) => handleFieldChange('confirmPassword', value)}
            onBlur={() => handleBlur('confirmPassword')}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            disabled={isLoading}
            error={!!errors.confirmPassword}
            autoComplete="password-new"
            accessible={true}
            accessibilityLabel="Confirm password input"
          />
          <HelperText type="error" visible={!!errors.confirmPassword}>
            {errors.confirmPassword}
          </HelperText>

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            disabled={
              isLoading ||
              !email ||
              !password ||
              !firstName ||
              !lastName ||
              !!errors.email ||
              !!errors.password ||
              !!errors.firstName ||
              !!errors.lastName ||
              !!errors.confirmPassword
            }
            loading={isLoading}
            accessible={true}
            accessibilityLabel="Sign up button"
            accessibilityRole="button"
          >
            Sign Up
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.linkButton}
            disabled={isLoading}
          >
            Already have an account? Sign In
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
