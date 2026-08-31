import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock state shared between the mock module and tests
let mockActiveTextEditor: any = null;

const mockShowErrorMessage = vi.fn();
const mockExecuteCommand = vi.fn();
const mockRegisterCommand = vi.fn();
const mockRegisterCustomEditorProvider = vi.fn();
const mockOnDidSaveTextDocument = vi.fn();
const mockGetConfiguration = vi.fn();

vi.mock('vscode', () => ({
  window: {
    get activeTextEditor() {
      return mockActiveTextEditor;
    },
    showErrorMessage: mockShowErrorMessage,
    registerCustomEditorProvider: mockRegisterCustomEditorProvider,
  },
  commands: {
    registerCommand: mockRegisterCommand,
    executeCommand: mockExecuteCommand,
  },
  workspace: {
    onDidSaveTextDocument: mockOnDidSaveTextDocument,
    getConfiguration: mockGetConfiguration,
  },
}));

describe('extension manifest', () => {
  const manifest = JSON.parse(
    readFileSync(resolve(__dirname, '../package.json'), 'utf8'),
  ) as { contributes: { menus?: Record<string, Array<{ command: string; when: string; group: string }>> } };

  for (const menu of ['explorer/context', 'editor/title/context']) {
    it(`shows Open as TypeScript for JavaScript files in ${menu}`, () => {
      expect(manifest.contributes.menus?.[menu]).toContainEqual({
        command: 'tMinusTS.openAsTypeScript',
        when: 'resourceLangId == javascript',
        group: 'navigation',
      });
    });
  }
});

describe('extension', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveTextEditor = null;
  });

  describe('activate', () => {
    it('should register the custom editor provider', async () => {
      const { activate } = await import('../src/extension');
      const mockContext = { subscriptions: [] as any[] };

      activate(mockContext as any);

      expect(mockRegisterCustomEditorProvider).toHaveBeenCalledWith(
        'tMinusTS.typescriptEditor',
        expect.any(Object),
        expect.objectContaining({
          webviewOptions: { retainContextWhenHidden: true },
        })
      );
    });

    it('should register the openAsTypeScript command', async () => {
      const { activate } = await import('../src/extension');
      const mockContext = { subscriptions: [] as any[] };

      activate(mockContext as any);

      expect(mockRegisterCommand).toHaveBeenCalledWith(
        'tMinusTS.openAsTypeScript',
        expect.any(Function)
      );
    });

    it('should push both provider and command to subscriptions', async () => {
      const { activate } = await import('../src/extension');
      const mockContext = { subscriptions: [] as any[] };

      activate(mockContext as any);

      expect(mockContext.subscriptions.length).toBe(2);
    });
  });

  describe('openAsTypeScript command handler', () => {
    it('should show error when no active editor is open', async () => {
      const { activate } = await import('../src/extension');
      const mockContext = { subscriptions: [] as any[] };

      activate(mockContext as any);

      const commandHandler = mockRegisterCommand.mock.calls.find(
        (call: any[]) => call[0] === 'tMinusTS.openAsTypeScript'
      )?.[1];

      expect(commandHandler).toBeDefined();
      commandHandler();

      expect(mockShowErrorMessage).toHaveBeenCalledWith(
        'No active editor found. Open a .js file first.'
      );
      expect(mockExecuteCommand).not.toHaveBeenCalled();
    });

    it('should show error when active document is not a .js file', async () => {
      const { activate } = await import('../src/extension');
      const mockContext = { subscriptions: [] as any[] };

      activate(mockContext as any);

      const commandHandler = mockRegisterCommand.mock.calls.find(
        (call: any[]) => call[0] === 'tMinusTS.openAsTypeScript'
      )?.[1];

      mockActiveTextEditor = {
        document: {
          languageId: 'typescript',
          uri: { scheme: 'file' },
        },
      };

      commandHandler();

      expect(mockShowErrorMessage).toHaveBeenCalledWith(
        'Unsupported file type. Open as TypeScript works with JavaScript (.js) files.'
      );
      expect(mockExecuteCommand).not.toHaveBeenCalled();
    });

    it('should open the custom editor for a .js file', async () => {
      const { activate } = await import('../src/extension');
      const mockContext = { subscriptions: [] as any[] };

      activate(mockContext as any);

      const commandHandler = mockRegisterCommand.mock.calls.find(
        (call: any[]) => call[0] === 'tMinusTS.openAsTypeScript'
      )?.[1];

      const mockUri = { scheme: 'file', path: '/test/file.js' };

      mockActiveTextEditor = {
        document: {
          languageId: 'javascript',
          uri: mockUri,
        },
      };

      commandHandler();

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        'vscode.openWith',
        mockUri,
        'tMinusTS.typescriptEditor'
      );
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });
  });
});
