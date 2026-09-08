import 'package:flutter/material.dart';
import 'core/services/storage_service.dart';
import 'data/models/user_model.dart';
import 'data/services/auth_api_service.dart';
import 'presentation/screens/login_screen.dart';
import 'presentation/screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const FinanceManagerApp());
}

class FinanceManagerApp extends StatelessWidget {
  const FinanceManagerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Finance Manager',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        primarySwatch: Colors.sky,
        useMaterial3: true,
      ),
      home: const AuthSplashWrapper(),
    );
  }
}

class AuthSplashWrapper extends StatefulWidget {
  const AuthSplashWrapper({super.key});

  @override
  State<AuthSplashWrapper> createState() => _AuthSplashWrapperState();
}

class _AuthSplashWrapperState extends State<AuthSplashWrapper> {
  @override
  void initState() {
    super.initState();
    _checkInitialAuth();
  }

  Future<void> _checkInitialAuth() async {
    final token = await StorageService.getToken();

    if (token != null && token.isNotEmpty) {
      try {
        final user = await AuthApiService.getMe(token);
        await StorageService.saveUser(user);

        if (!mounted) return;
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => HomeScreen(user: user)),
        );
        return;
      } catch (_) {
        // Token không hợp lệ hoặc đã hết hạn
        await StorageService.clearAuthData();
      }
    }

    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(
          color: Color(0xFF38BDF8),
        ),
      ),
    );
  }
}
