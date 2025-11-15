import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, Key, User, RefreshCw } from 'lucide-react';

interface SettingsProps {
    onConfigUpdate: () => void;
    onTabChange?: (tab: string) => void;
}

export default function Settings({ onConfigUpdate, onTabChange }: SettingsProps) {
    const [config, setConfig] = useState({ decryptionKey: '', employeeId: '', dbPath: '' });
    const [dbPath, setDbPath] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({ decryptionKey: '', employeeId: '' });

    useEffect(() => {
        loadConfig();
        discoverDb();
    }, []);

    const loadConfig = async () => {
        const result = await window.electronAPI.getConfig();
        if (result.success && result.config) {
            setConfig(result.config);
        }
    };

    const discoverDb = async () => {
        const result = await window.electronAPI.discoverDatabase();
        if (result.success && result.path) {
            setDbPath(result.path);
        }
    };

    const handleSave = async () => {
        // Validate required fields
        const newErrors = { decryptionKey: '', employeeId: '' };
        let hasErrors = false;

        if (!config.decryptionKey.trim()) {
            newErrors.decryptionKey = 'Decryption key is required';
            hasErrors = true;
        }

        if (!config.employeeId.trim()) {
            newErrors.employeeId = 'Employee ID is required';
            hasErrors = true;
        }

        setErrors(newErrors);

        if (hasErrors) {
            setMessage('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setMessage('');

        const result = await window.electronAPI.setConfig(config);

        if (result.success) {
            setMessage('Configuration saved successfully!');
            onConfigUpdate();
            // Navigate to Summary tab after successful save
            setTimeout(() => {
                if (onTabChange) onTabChange('summary');
            }, 500);
        } else {
            setMessage(`Error: ${result.error}`);
        }

        setLoading(false);
    };

    const handleRefresh = async () => {
        setLoading(true);
        setMessage('');

        const result = await window.electronAPI.refreshData();

        if (result.success) {
            setMessage('Data refreshed successfully!');
            onConfigUpdate();
            // Navigate to Summary tab after successful refresh
            setTimeout(() => {
                if (onTabChange) onTabChange('summary');
            }, 500);
        } else {
            setMessage(`Error: ${result.error}`);
        }

        setLoading(false);
    };

    return (
        <div className='space-y-6'>
            <div>
                <h2 className='text-3xl font-bold tracking-tight'>Settings</h2>
                <p className='text-muted-foreground'>Configure your ActivityTracker analysis parameters</p>
            </div>

            <div className='grid gap-6'>
                <div className='grid gap-6 md:grid-cols-2'>
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <RefreshCw className='h-5 w-5' />
                                Data Management
                            </CardTitle>
                            <CardDescription>Refresh data from ActivityTracker database</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-4'>
                                <Button onClick={handleRefresh} disabled={loading || !dbPath} className='w-full' variant='outline'>
                                    <RefreshCw className='mr-2 h-4 w-4' />
                                    Refresh Data from Database
                                </Button>
                                <p className='text-xs text-muted-foreground'>Click to re-export the latest data from ActivityTracker database.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <Database className='h-5 w-5' />
                                Database Location
                            </CardTitle>
                            <CardDescription>ActivityTracker database path (auto-detected)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-2'>
                                <Input value={dbPath} readOnly className='font-mono text-sm' placeholder='Database not found' />
                                {!dbPath && <p className='text-sm text-destructive'>⚠️ Database not found. Please ensure ActivityTracker is installed and has generated data.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className='grid gap-6 md:grid-cols-2'>
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <Key className='h-5 w-5' />
                                Decryption Key
                            </CardTitle>
                            <CardDescription>Fernet encryption key for decrypting activity data</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-2'>
                                <Label htmlFor='decryption-key'>
                                    Decryption Key <span className='text-destructive'>*</span>
                                </Label>
                                <Input
                                    id='decryption-key'
                                    type='password'
                                    value={config.decryptionKey}
                                    onChange={e => {
                                        setConfig({ ...config, decryptionKey: e.target.value });
                                        setErrors({ ...errors, decryptionKey: '' });
                                    }}
                                    placeholder='Enter your Fernet decryption key'
                                    className={errors.decryptionKey ? 'border-destructive' : ''}
                                />
                                {errors.decryptionKey && <p className='text-sm text-destructive'>{errors.decryptionKey}</p>}
                                <p className='text-xs text-muted-foreground'>This key is required to decrypt duration and AFK status from your activity data.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <User className='h-5 w-5' />
                                Employee ID
                            </CardTitle>
                            <CardDescription>Your employee identifier for filtering data</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-2'>
                                <Label htmlFor='employee-id'>
                                    Employee ID <span className='text-destructive'>*</span>
                                </Label>
                                <Input
                                    id='employee-id'
                                    value={config.employeeId}
                                    onChange={e => {
                                        setConfig({ ...config, employeeId: e.target.value });
                                        setErrors({ ...errors, employeeId: '' });
                                    }}
                                    placeholder='Enter your employee ID'
                                    className={errors.employeeId ? 'border-destructive' : ''}
                                />
                                {errors.employeeId && <p className='text-sm text-destructive'>{errors.employeeId}</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {message && (
                    <Card className={message.includes('Error') ? 'border-destructive' : 'border-green-500'}>
                        <CardContent className='pt-6'>
                            <p className={message.includes('Error') ? 'text-destructive' : 'text-green-500'}>{message}</p>
                        </CardContent>
                    </Card>
                )}

                <div className='flex gap-4'>
                    <Button onClick={handleSave} disabled={loading} className='flex-1'>
                        {loading ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
