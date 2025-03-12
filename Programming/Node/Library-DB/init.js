import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";

/**
 * Ouvre une connexion à la base de données SQLite.
 * @returns {Promise<import('sqlite').Database>} Instance de la base de données.
 */
export async function openDb() {
    try {
        const db = await open({
            filename: "./bibliotheque.db",
            driver: sqlite3.Database,
        });

        await db.exec("PRAGMA foreign_keys = ON;");
        await initDb(db);

        return db;
    } catch (error) {
        throw new Error("Failed to open database", error);
    }
}

/**
 * Initialise la structure de la base de données.
 * @param {import('sqlite').Database} db - Instance de la base de données.
 */
async function initDb(db) {
    try {
        const sqlFile = fs.readFileSync("./init.sql", "utf-8");
        const sqlStatements = sqlFile.split(";").filter((line) => line.trim() !== "");
        for (const statement of sqlStatements) {
            await db.exec(statement);
        }

        console.log("Database initialized");

        // Insérer au moins 3 nouvelles catégories
        await insertDatas(db, {name: "Science-Fiction", description: "Récits explorant le futur, la technologie et l’espace, souvent basés sur des avancées scientifiques."});
        await insertDatas(db, {name: "Fantastique", description: "Histoires se déroulant dans des mondes imaginaires avec magie, créatures mythiques et épopées héroïques."});
        await insertDatas(db, {name: "Romance", description: "Récits centrés sur les relations amoureuses, les émotions et les défis du cœur."});

        // Insérer au moins 4 nouveaux auteurs
        await insertDatas(db, {firstname: "Veronica", lastname: "Roth"}); // Divergente
        await insertDatas(db, {firstname: "J.K.", lastname: "Rowling"}); // Harry Potter
        await insertDatas(db, {firstname: "Suzanne", lastname: "Collins"}); // Hunger Games
        await insertDatas(db, {firstname: "Alice", lastname: "Oseman"}); // Heartstopper

        // Insérer et associer les livres aux auteurs
        await insertBooksAndAuthors(db);

    } catch (error) {
        throw new Error("Failed to initialize database", error);
    }
}

async function insertDatas(db, data = {}) {
    if(Object.keys(data).length === 0) {
        console.error('Maguimauve');
        return;
    }

    if(data.name && data.description) {
        return await db.run("INSERT INTO CATEGORIES (name, description) VALUES (?, ?)", [data.name, data.description]);
    } else if(data.firstname && data.lastname) {
        return await db.run("INSERT INTO AUTHORS (lastname, firstname) VALUES (?, ?)", [data.lastname, data.firstname]);
    } else if(data.title && data.rare !== undefined && data.category_id) {
        return await db.run("INSERT INTO BOOKS (title, rare, category_id) VALUES (?, ?, ?)", [data.title, data.rare, data.category_id]);
    }
}

/**
 * Récupère l'ID d'un auteur depuis son prénom et son nom.
 */
async function getAuthorId(db, firstname, lastname) {
    const row = await db.get("SELECT id FROM AUTHORS WHERE firstname = ? AND lastname = ?", [firstname, lastname]);
    return row ? row.id : null;
}

/**
 * Insère un livre dans la base de données.
 */
async function insertBook(db, { title, rare, category_id }) {
    const result = await db.run("INSERT INTO BOOKS (title, rare, category_id) VALUES (?, ?, ?)", [title, rare, category_id]);
    return result.lastID;
}

/**
 * Associe un livre à un auteur dans BOOKS_AUTHORS.
 */
async function linkBookAuthor(db, bookId, authorId) {
    return await db.run("INSERT INTO BOOKS_AUTHORS (book_id, author_id) VALUES (?, ?)", [bookId, authorId]);
}

/**
 * Insère les livres et les associe aux auteurs.
 */
async function insertBooksAndAuthors(db) {
    const books = [
        { title: "Divergente", author: { firstname: "Veronica", lastname: "Roth" }, rare: 0, category_id: 1 },
        { title: "Harry Potter à l'école des sorciers", author: { firstname: "J.K.", lastname: "Rowling" }, rare: 0, category_id: 2 },
        { title: "Harry Potter et la Chambre des Secrets", author: { firstname: "J.K.", lastname: "Rowling" }, rare: 0, category_id: 2 },
        { title: "Hunger Games", author: { firstname: "Suzanne", lastname: "Collins" }, rare: 0, category_id: 1 },
        { title: "Catching Fire", author: { firstname: "Suzanne", lastname: "Collins" }, rare: 0, category_id: 1 },
        { title: "Mockingjay", author: { firstname: "Suzanne", lastname: "Collins" }, rare: 0, category_id: 1 },
        { title: "Heartstopper - Tome 1", author: { firstname: "Alice", lastname: "Oseman" }, rare: 0, category_id: 3 },
        { title: "Heartstopper - Tome 2", author: { firstname: "Alice", lastname: "Oseman" }, rare: 0, category_id: 3 },
        { title: "Heartstopper - Tome 3", author: { firstname: "Alice", lastname: "Oseman" }, rare: 0, category_id: 3 },
        { title: "Heartstopper - Tome 4", author: { firstname: "Alice", lastname: "Oseman" }, rare: 0, category_id: 3 },
    ];

    for (const book of books) {
        const authorId = await getAuthorId(db, book.author.firstname, book.author.lastname);
        if (!authorId) {
            console.error(`Auteur ${book.author.firstname} ${book.author.lastname} non trouvé.`);
            continue;
        }

        const bookId = await insertBook(db, { title: book.title, rare: book.rare, category_id: book.category_id });
        await linkBookAuthor(db, bookId, authorId);
        console.log(`Livre "${book.title}" inséré et lié à ${book.author.firstname} ${book.author.lastname}`);
    }
}

// Lancement
openDb().then(db => {
    console.log("Base de données prête !");

    // Afficher tous les livres d'Alice Oseman
    db.all("SELECT * FROM BOOKS WHERE id IN (SELECT book_id FROM BOOKS_AUTHORS WHERE author_id = (SELECT id FROM AUTHORS WHERE firstname = 'Alice' AND lastname = 'Oseman'))")
        .then(rows => rows.forEach(row => console.log(row.title)));
    
    // Afficher tous les livres d'une catégorie donnée par nom
    db.all("SELECT * FROM BOOKS WHERE category_id = (SELECT id FROM CATEGORIES WHERE name = 'Fantastique')")
        .then(rows => rows.forEach(row => console.log(row.title)));

    // Afficher les livres avec leurs auteurs et catégories
    db.all("SELECT b.title, a.firstname, a.lastname, c.name FROM BOOKS b JOIN BOOKS_AUTHORS ba ON b.id = ba.book_id JOIN AUTHORS a ON ba.author_id = a.id JOIN CATEGORIES c ON b.category_id = c.id")
        .then(rows => rows.forEach(row => console.log(`${row.title} (${row.name}) - ${row.firstname} ${row.lastname}`)));

    // Afficher le nombre de livres par catégorie
    db.all("SELECT c.name, COUNT(*) AS nb_books FROM CATEGORIES c JOIN BOOKS b ON c.id = b.category_id GROUP BY c.name")
        .then(rows => rows.forEach(row => console.log(`${row.name} : ${row.nb_books} livre(s)`)));

    // Trouver l'auteur ayant écrit le plus de livres
    db.get("SELECT a.firstname, a.lastname, COUNT(*) AS nb_books FROM AUTHORS a JOIN BOOKS_AUTHORS ba ON a.id = ba.author_id GROUP BY a.id ORDER BY nb_books DESC LIMIT 1")
        .then(row => console.log(`${row.firstname} ${row.lastname} a écrit ${row.nb_books} livre(s)`));

    // -------

    // Modifier le titre d'un livre
    db.run("UPDATE BOOKS SET title = 'Divergente - Tome 1' WHERE title = 'Divergente'")
        .then(() => console.log("Titre du livre modifié"));

    // Supprimer un livre
    db.run("DELETE FROM BOOKS WHERE title = 'Heartstopper - Tome 4'")
        .then(() => console.log("Livre supprimé"));

}).catch(err => console.error("Erreur :", err));

// SELECT * FROM BOOKS WHERE id IN (SELECT book_id FROM BOOKS_AUTHORS WHERE author_id = 1)