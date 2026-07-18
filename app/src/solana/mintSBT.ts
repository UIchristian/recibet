import {
    Connection,
    Keypair,
    SystemProgram,
    Transaction
} from '@solana/web3.js';
import {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintInstruction,
    createInitializeNonTransferableMintInstruction,
    getMintLen,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddressSync,
    createMintToInstruction,
    createInitializeMetadataPointerInstruction
} from '@solana/spl-token';
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';

export const mintSBT = async (
    connection: Connection,
    wallet: any,
    commitmentHash: string
) => {
    if (!wallet.publicKey || !wallet.signTransaction) throw new Error("Carteira não conectada.");

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    const decimals = 0;

    const metadata = {
        mint: mint,
        name: "Recibo Oficial",
        symbol: "RECIBO",
        uri: `https://api.txline.mock/verify/${commitmentHash}`,
        additionalMetadata: [
            ["commitment", commitmentHash]
        ],
    };

    const mintLen = getMintLen([
        ExtensionType.NonTransferable,
        ExtensionType.MetadataPointer
    ]);

    const metadataExtension = 72; // basic padding
    const metadataLen = pack(metadata).length + metadataExtension;

    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeNonTransferableMintInstruction(mint, TOKEN_2022_PROGRAM_ID),
        createInitializeMetadataPointerInstruction(mint, wallet.publicKey, mint, TOKEN_2022_PROGRAM_ID),
        createInitializeMintInstruction(mint, decimals, wallet.publicKey, null, TOKEN_2022_PROGRAM_ID),
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mint,
            updateAuthority: wallet.publicKey,
            mint: mint,
            mintAuthority: wallet.publicKey,
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
        })
    );

    const ata = getAssociatedTokenAddressSync(
        mint,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
    );

    transaction.add(
        createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            ata,
            wallet.publicKey,
            mint,
            TOKEN_2022_PROGRAM_ID
        ),
        createMintToInstruction(
            mint,
            ata,
            wallet.publicKey,
            1,
            [],
            TOKEN_2022_PROGRAM_ID
        )
    );

    transaction.feePayer = wallet.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    transaction.partialSign(mintKeypair);

    const signedTx = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(signature);
    
    return { signature, mint: mint.toBase58() };
};
