class ApiHeaders {
  static const Map<String, String> json = {'Content-Type': 'application/json'};

  static Map<String, String> auth(String token) => {
        ...json,
        'Authorization': 'Bearer $token',
      };
}
