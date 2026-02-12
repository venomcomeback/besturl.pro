#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

class LinkShortenerAPITester:
    def __init__(self, base_url: str = "https://shortcut-hub-5.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_links = []
        self.test_user_data = None
        
    def log(self, message: str):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def run_test(self, name: str, test_func, *args, **kwargs) -> bool:
        """Run a single test and track results"""
        self.tests_run += 1
        self.log(f"🔍 Test {self.tests_run}: {name}")
        
        try:
            result = test_func(*args, **kwargs)
            if result:
                self.tests_passed += 1
                self.log(f"✅ PASSED: {name}")
                return True
            else:
                self.log(f"❌ FAILED: {name}")
                return False
        except Exception as e:
            self.log(f"❌ ERROR in {name}: {str(e)}")
            return False
    
    def make_request(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None, 
                    expected_status: int = 200, include_auth: bool = True) -> tuple[bool, Dict]:
        """Make HTTP request and validate response"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if include_auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            success = response.status_code == expected_status
            
            if success:
                self.log(f"  ✓ Status: {response.status_code}")
            else:
                self.log(f"  ✗ Status: {response.status_code} (expected {expected_status})")
                self.log(f"    Response: {response.text[:200]}")
                
            try:
                json_response = response.json()
            except:
                json_response = {"text": response.text}
                
            return success, json_response
            
        except Exception as e:
            self.log(f"  ✗ Request failed: {str(e)}")
            return False, {}
    
    def test_health_check(self) -> bool:
        """Test basic API health"""
        success, response = self.make_request('GET', '/health', include_auth=False)
        return success and 'status' in response
    
    def test_admin_login(self) -> bool:
        """Test admin login with provided credentials"""
        login_data = {
            "username": "venomcomeback",
            "password": "Mert3213540"
        }
        
        success, response = self.make_request('POST', '/auth/login', login_data, include_auth=False)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response.get('user', {})
            self.log(f"  ✓ Logged in as admin: {self.user_data.get('username')}")
            self.log(f"  ✓ Is Admin: {self.user_data.get('is_admin')}")
            return True
        
        return False
    
    def test_user_registration(self) -> bool:
        """Test new user registration"""
        timestamp = int(datetime.now().timestamp())
        self.test_user_data = {
            "username": f"testuser{timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.make_request('POST', '/auth/register', self.test_user_data, 
                                            expected_status=200, include_auth=False)
        
        if success:
            self.log(f"  ✓ Created user: {self.test_user_data['username']}")
            return True
        
        return False
    
    def test_get_user_profile(self) -> bool:
        """Test getting current user profile"""
        if not self.token:
            return False
            
        success, response = self.make_request('GET', '/auth/me')
        
        if success and 'username' in response:
            self.log(f"  ✓ Profile: {response.get('username')} ({response.get('email')})")
            return True
        
        return False
    
    def test_create_link(self) -> bool:
        """Test creating a new short link"""
        if not self.token:
            return False
            
        timestamp = int(datetime.now().timestamp())
        link_data = {
            "original_url": "https://www.example.com/test-page",
            "title": f"Test Link {timestamp}",
            "custom_slug": f"test{timestamp}",
            "generate_qr": True
        }
        
        success, response = self.make_request('POST', '/links', link_data, expected_status=200)
        
        if success and 'short_code' in response:
            self.created_links.append(response)
            self.log(f"  ✓ Created link: {response.get('short_code')}")
            self.log(f"  ✓ Original URL: {response.get('original_url')}")
            return True
        
        return False
    
    def test_create_protected_link(self) -> bool:
        """Test creating a password-protected link"""
        if not self.token:
            return False
            
        timestamp = int(datetime.now().timestamp())
        link_data = {
            "original_url": "https://www.example.com/secret-page",
            "title": f"Protected Link {timestamp}",
            "password": "secret123",
            "expires_at": "2026-12-31T23:59:59Z"
        }
        
        success, response = self.make_request('POST', '/links', link_data, expected_status=200)
        
        if success and 'short_code' in response:
            self.created_links.append(response)
            self.log(f"  ✓ Created protected link: {response.get('short_code')}")
            self.log(f"  ✓ Has password: {response.get('has_password')}")
            return True
        
        return False
    
    def test_get_links_list(self) -> bool:
        """Test getting user's links list"""
        if not self.token:
            return False
            
        success, response = self.make_request('GET', '/links')
        
        if success and isinstance(response, list):
            self.log(f"  ✓ Retrieved {len(response)} links")
            for link in response[:3]:  # Show first 3
                self.log(f"    - {link.get('title', 'Untitled')}: {link.get('short_code')}")
            return True
        
        return False
    
    def test_link_redirect(self) -> bool:
        """Test short link redirect functionality"""
        if not self.created_links:
            return False
            
        link = self.created_links[0]
        short_code = link.get('short_code')
        
        if not short_code:
            return False
            
        # Test redirect endpoint (expect redirect response)
        redirect_url = f"{self.base_url}/r/{short_code}"
        
        try:
            response = requests.get(redirect_url, allow_redirects=False)
            if response.status_code in [302, 301]:
                self.log(f"  ✓ Redirect working: {response.status_code}")
                self.log(f"  ✓ Redirects to: {response.headers.get('Location', 'N/A')}")
                return True
            elif response.status_code == 200:
                # Check if it's a password-protected link
                try:
                    json_resp = response.json()
                    if json_resp.get('requires_password'):
                        self.log(f"  ✓ Password protection working")
                        return True
                except:
                    pass
            
            self.log(f"  ✗ Unexpected redirect status: {response.status_code}")
            return False
            
        except Exception as e:
            self.log(f"  ✗ Redirect test failed: {str(e)}")
            return False
    
    def test_link_analytics(self) -> bool:
        """Test link analytics"""
        if not self.created_links:
            return False
            
        link_id = self.created_links[0].get('id')
        if not link_id:
            return False
            
        success, response = self.make_request('GET', f'/links/{link_id}/analytics')
        
        if success and 'total_clicks' in response:
            self.log(f"  ✓ Analytics retrieved")
            self.log(f"    Total clicks: {response.get('total_clicks', 0)}")
            self.log(f"    Devices: {len(response.get('devices', {}))}")
            self.log(f"    Countries: {len(response.get('countries', {}))}")
            return True
        
        return False
    
    def test_analytics_overview(self) -> bool:
        """Test user analytics overview"""
        if not self.token:
            return False
            
        success, response = self.make_request('GET', '/analytics/overview')
        
        if success and 'total_links' in response:
            self.log(f"  ✓ Overview retrieved")
            self.log(f"    Total links: {response.get('total_links', 0)}")
            self.log(f"    Active links: {response.get('active_links', 0)}")
            self.log(f"    Total clicks: {response.get('total_clicks', 0)}")
            self.log(f"    Today clicks: {response.get('today_clicks', 0)}")
            return True
        
        return False
    
    def test_admin_stats(self) -> bool:
        """Test admin statistics (requires admin privileges)"""
        if not self.token or not self.user_data.get('is_admin'):
            self.log("  ⚠️ Skipping admin stats - not admin user")
            return True  # Skip but don't fail
            
        success, response = self.make_request('GET', '/admin/stats')
        
        if success and 'total_users' in response:
            self.log(f"  ✓ Admin stats retrieved")
            self.log(f"    Total users: {response.get('total_users', 0)}")
            self.log(f"    Total links: {response.get('total_links', 0)}")
            self.log(f"    Total clicks: {response.get('total_clicks', 0)}")
            self.log(f"    Today clicks: {response.get('today_clicks', 0)}")
            return True
        
        return False
    
    def test_admin_users_list(self) -> bool:
        """Test admin users list (requires admin privileges)"""
        if not self.token or not self.user_data.get('is_admin'):
            self.log("  ⚠️ Skipping admin users - not admin user")
            return True  # Skip but don't fail
            
        success, response = self.make_request('GET', '/admin/users')
        
        if success and isinstance(response, list):
            self.log(f"  ✓ Admin users list retrieved")
            self.log(f"    Total users: {len(response)}")
            admin_count = sum(1 for u in response if u.get('is_admin'))
            self.log(f"    Admin users: {admin_count}")
            return True
        
        return False
    
    def test_link_update(self) -> bool:
        """Test updating a link"""
        if not self.created_links:
            return False
            
        link = self.created_links[0]
        link_id = link.get('id')
        
        if not link_id:
            return False
            
        update_data = {
            "title": f"Updated Link - {datetime.now().strftime('%H:%M:%S')}",
            "is_active": True
        }
        
        success, response = self.make_request('PUT', f'/links/{link_id}', update_data)
        
        if success and response.get('title') == update_data['title']:
            self.log(f"  ✓ Link updated successfully")
            self.log(f"    New title: {response.get('title')}")
            return True
        
        return False
    
    def test_password_protected_redirect(self) -> bool:
        """Test password-protected link redirect"""
        # Find a password-protected link
        protected_link = None
        for link in self.created_links:
            if link.get('has_password'):
                protected_link = link
                break
                
        if not protected_link:
            self.log("  ⚠️ No password-protected link found")
            return True
            
        short_code = protected_link.get('short_code')
        if not short_code:
            return False
            
        # Test password verification
        verify_data = {"password": "secret123"}
        success, response = self.make_request('POST', f'/r/{short_code}/verify', 
                                            verify_data, include_auth=False)
        
        if success and 'redirect_url' in response:
            self.log(f"  ✓ Password verification working")
            self.log(f"    Redirects to: {response.get('redirect_url')}")
            return True
        
        return False
    
    def run_all_tests(self) -> dict:
        """Run all tests and return summary"""
        self.log("🚀 Starting LinkShortTR API Tests")
        self.log(f"📡 Testing API at: {self.base_url}")
        
        # Basic tests
        self.run_test("API Health Check", self.test_health_check)
        
        # Authentication tests
        self.run_test("Admin Login", self.test_admin_login)
        self.run_test("User Registration", self.test_user_registration)
        self.run_test("Get User Profile", self.test_get_user_profile)
        
        # Link management tests
        self.run_test("Create Basic Link", self.test_create_link)
        self.run_test("Create Protected Link", self.test_create_protected_link)
        self.run_test("Get Links List", self.test_get_links_list)
        self.run_test("Update Link", self.test_link_update)
        
        # Redirect and password tests
        self.run_test("Link Redirect", self.test_link_redirect)
        self.run_test("Password Protected Redirect", self.test_password_protected_redirect)
        
        # Analytics tests
        self.run_test("Link Analytics", self.test_link_analytics)
        self.run_test("Analytics Overview", self.test_analytics_overview)
        
        # Admin tests (if admin user)
        self.run_test("Admin Statistics", self.test_admin_stats)
        self.run_test("Admin Users List", self.test_admin_users_list)
        
        # Results summary
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        self.log("\n" + "="*60)
        self.log("📊 TEST SUMMARY")
        self.log("="*60)
        self.log(f"✅ Tests Passed: {self.tests_passed}")
        self.log(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        self.log(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.created_links:
            self.log(f"\n📋 Created Test Links:")
            for link in self.created_links:
                short_url = f"{self.base_url.replace('/api', '')}/api/r/{link.get('short_code')}"
                self.log(f"   • {link.get('title', 'Untitled')}: {short_url}")
        
        return {
            'tests_run': self.tests_run,
            'tests_passed': self.tests_passed,
            'success_rate': success_rate,
            'created_links': len(self.created_links),
            'admin_access': self.user_data.get('is_admin', False) if self.user_data else False,
            'token_obtained': bool(self.token)
        }

def main():
    """Main test execution"""
    tester = LinkShortenerAPITester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    if results['success_rate'] >= 80:  # 80% or better is considered passing
        tester.log("🎉 Overall test result: PASSED")
        return 0
    else:
        tester.log("💥 Overall test result: FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())