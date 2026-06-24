/**
 * ERROR BOUNDARY
 *
 * WHY CLASS COMPONENT (not functional):
 * React's error boundary API requires `componentDidCatch` and
 * `getDerivedStateFromError`. These lifecycle methods are ONLY
 * available on class components. There is no hooks equivalent.
 * This is one of the few legitimate uses of class components in
 * modern React.
 *
 * WHY PER-SECTION BOUNDARIES:
 * If BannerHero crashes due to malformed data, the ErrorBoundary
 * catches the error, renders null (or a fallback), and the rest
 * of the homepage continues rendering normally.
 *
 * WITHOUT ErrorBoundary:
 * One malformed section crashes the entire homepage. The FlashList
 * unmounts. Users see a white screen. Revenue impact.
 *
 * WITH ErrorBoundary:
 * BannerHero fails silently (logged to Sentry). ProductGrid,
 * Collections, FlashSale all render normally. Revenue preserved.
 *
 * WHY onError callback:
 * The parent (DynamicRenderer) receives the error and can:
 * - Log to Sentry/Datadog
 * - Mark the section as "broken" in telemetry
 * - Send alert to on-call engineer
 */

import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Rendered when an error is caught. null = silent skip */
  fallback?: ReactNode;
  /** Called when an error is caught. Use for logging. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show a dev-only error card instead of null */
  showDevError?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static defaultProps = {
    fallback: null,
    showDevError: __DEV__,
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  /**
   * WHY static getDerivedStateFromError:
   * This is called during render phase (synchronously).
   * Returns new state to switch to fallback rendering.
   * Must be static (no access to `this`).
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * WHY componentDidCatch:
   * This is called in commit phase (after render).
   * Safe to call external services (Sentry, etc.) here.
   * Has access to both error and React component stack.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Notify parent
    this.props.onError?.(error, errorInfo);

    // In production, send to error monitoring
    // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });

    console.error('[ErrorBoundary] Caught error:', error.message);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // In production, render null (silent skip)
    if (!this.props.showDevError) {
      return this.props.fallback ?? null;
    }

    // In development, show a visible error card
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorTitle}>⚠️ Section Error (Dev Only)</Text>
        <Text style={styles.errorMessage}>{this.state.error?.message}</Text>
        <Text style={styles.errorNote}>
          This section is hidden in production. Other sections render normally.
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  errorCard: {
    margin: 12,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 12,
    color: '#7F1D1D',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  errorNote: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});
