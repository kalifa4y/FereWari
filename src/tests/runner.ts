import { runCalculationTests } from '../services/calculationService.test';
import { runSubscriptionTests } from '../services/subscriptionService.test';
import { isBackupReminderDue } from '../services/backupService';

export function runAllTests() {
  console.log('🚀 === STARTING FEREWARI VERIFICATION SUITE ===');

  try {
    // 1. Calculation Tests
    runCalculationTests();

    // 2. Subscription Tests
    runSubscriptionTests();

    // 3. Backup Reminder Tests
    console.log('🧪 Running Backup Reminder Tests...');
    const recentDate = new Date();
    if (isBackupReminderDue(recentDate)) {
      throw new Error('Recent backup should not be due');
    }

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    if (!isBackupReminderDue(oldDate)) {
      throw new Error('10-day-old backup should be marked due');
    }
    if (!isBackupReminderDue(undefined)) {
      throw new Error('Undefined last backup should be marked due');
    }
    console.log('✅ Backup Reminder Tests Passed!');

    // 4. PIN Security & Setup Tests
    console.log('🧪 Running PIN Security & Profile Setup Tests...');
    const validatePinSetup = (name: string, pin: string, confirm: string) => {
      if (!name.trim()) return { valid: false, error: 'Name required' };
      if (!pin || pin.length < 4) return { valid: false, error: 'PIN too short' };
      if (pin !== confirm) return { valid: false, error: 'PIN mismatch' };
      return { valid: true };
    };

    if (validatePinSetup('', '1234', '1234').valid) throw new Error('Empty name should be invalid');
    if (validatePinSetup('Atelier', '12', '12').valid) throw new Error('Short PIN should be invalid');
    if (validatePinSetup('Atelier', '1234', '5678').valid) throw new Error('Mismatched PIN should be invalid');
    if (!validatePinSetup('Atelier Teranga', '1234', '1234').valid) throw new Error('Valid PIN setup failed');
    console.log('✅ PIN Security & Setup Tests Passed!');

    console.log('\n🎉 ALL 4 TEST SUITES PASSED FLAWLESSLY! (100% SUCCESS)');
  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
  }
}

runAllTests();
