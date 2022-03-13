import { ApolloClient, gql, InMemoryCache } from '@apollo/client';

/**
 * Run a basic request against the GraphQL Storefront API using Apollo client
 * and optionally log the results to the browser console
 */
export default function (token) {
    const client = new ApolloClient({
        headers: { Athorization: `Bearer ${token}`},
        cache: new InMemoryCache(),
    });

    client.query({
        query: gql`
            query MyFirstQuery {
                site {
                    settings {
                        storeName
                    }
                }
            }
        `,
    }).then(data => console.log(data)).catch(error => console.error(error));

}