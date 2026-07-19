import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionExpiredBlockheightExceededError
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

const MAX_ATTEMPTS = 3;

export const mintSBT = async (
    connection: Connection,
    wallet: any,
    commitmentHash: string,
    onAttempt?: (attempt: number, maxAttempts: number) => void
) => {
    if (!wallet.publicKey || !wallet.sendTransaction) throw new Error("Carteira não conectada.");

    const decimals = 0;
    const mintLen = getMintLen([
        ExtensionType.NonTransferable,
        ExtensionType.MetadataPointer
    ]);

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        onAttempt?.(attempt, MAX_ATTEMPTS);

        // Em vez de uma keypair efemera aleatoria (que exigiria uma SEGUNDA assinatura, da
        // propria keypair, alem da da carteira), derivamos o endereco do mint a partir da
        // carteira do usuario + uma seed unica. createAccountWithSeed nao exige assinatura do
        // endereco derivado, so do "base" (a carteira). Isso evita depender da extensao da
        // carteira preservar corretamente uma assinatura parcial de terceiros ao assinar,
        // algo que causava "Missing signature for public key" com algumas carteiras (ex: Zerion).
        const seed = crypto.randomUUID().replace(/-/g, '');
        const mint = await PublicKey.createWithSeed(wallet.publicKey, seed, TOKEN_2022_PROGRAM_ID);

        const metadata = {
            mint: mint,
            name: "Recibo Oficial",
            symbol: "RECIBO",
            uri: `https://api.txline.mock/verify/${commitmentHash}`,
            additionalMetadata: [
                ["commitment", commitmentHash]
            ] as [string, string][],
        };

        const metadataExtension = 72; // basic padding
        const metadataLen = pack(metadata).length + metadataExtension;
        const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

        const transaction = new Transaction().add(
            SystemProgram.createAccountWithSeed({
                fromPubkey: wallet.publicKey,
                basePubkey: wallet.publicKey,
                seed,
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
        // Buscamos o blockhash de novo a cada tentativa (nao antes do loop): ele so vale por
        // ~60-90s, e se a aprovacao na carteira demorar mais que isso, a rede rejeita com
        // "block height exceeded" mesmo com tudo mais correto. Se isso acontecer, tentamos
        // de novo com um blockhash (e endereco de mint) novos, em vez de falhar de vez.
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        try {
            // Unico assinante exigido agora e a propria carteira - sem segundo signer, nao ha
            // assinatura parcial de terceiros pra alguma extensao de carteira descartar.
            const signature = await wallet.sendTransaction(transaction, connection);
            await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
            return { signature, mint: mint.toBase58() };
        } catch (err) {
            const expired = err instanceof TransactionExpiredBlockheightExceededError;
            if (!expired || attempt === MAX_ATTEMPTS) throw err;
            // Blockhash expirou por demora na aprovacao - tenta de novo automaticamente.
        }
    }

    throw new Error("Não foi possível confirmar a transação após várias tentativas.");
};
