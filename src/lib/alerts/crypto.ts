/** AES-256-GCM via createCipheriv — shared with CMS credential encryption. */
export {
  decryptCmsSecret as decryptAlertSecret,
  encryptCmsSecret as encryptAlertSecret,
} from "@/lib/cms/crypto";
