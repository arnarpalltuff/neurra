import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { C } from '../../constants/colors';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Label shown above the error to identify which area crashed (e.g. "Insights tab"). */
  scope?: string;
  /** Show the raw error message + stack to aid debugging. Default: true. */
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', this.props.scope ?? '(root)', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const showDetails = this.props.showDetails !== false;
      const errMessage = this.state.error?.message ?? 'Unknown error';
      const errStack = this.state.error?.stack ?? '';

      return (
        <View style={styles.container}>
          {this.props.scope && (
            <Text style={styles.scopeLabel}>{this.props.scope.toUpperCase()}</Text>
          )}
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            Don't worry — your progress is saved.
          </Text>
          {showDetails && (
            <ScrollView style={styles.detailsBox} contentContainerStyle={styles.detailsContent}>
              <Text style={styles.detailsLabel}>ERROR</Text>
              <Text style={styles.detailsMessage} selectable>{errMessage}</Text>
              {errStack ? (
                <>
                  <Text style={[styles.detailsLabel, { marginTop: 12 }]}>STACK</Text>
                  <Text style={styles.detailsStack} selectable>{errStack}</Text>
                </>
              ) : null}
            </ScrollView>
          )}
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg1,
    padding: 24,
  },
  scopeLabel: {
    fontSize: 11,
    color: C.coral,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: C.t1,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: C.t2,
    textAlign: 'center',
    marginBottom: 16,
  },
  detailsBox: {
    maxHeight: 220,
    width: '100%',
    backgroundColor: 'rgba(232,112,126,0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(232,112,126,0.3)',
    marginBottom: 20,
  },
  detailsContent: {
    padding: 12,
  },
  detailsLabel: {
    fontSize: 10,
    color: C.coral,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailsMessage: {
    fontSize: 13,
    color: C.t1,
    fontFamily: 'Courier',
    lineHeight: 18,
  },
  detailsStack: {
    fontSize: 10,
    color: C.t2,
    fontFamily: 'Courier',
    lineHeight: 14,
  },
  button: {
    backgroundColor: C.green,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: C.bg2,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ErrorBoundary;
